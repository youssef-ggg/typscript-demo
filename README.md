# High-Concurrency Concert Ticket Reservation System

A high-performance TypeScript backend designed to handle concurrent seat reservation spikes. This project demonstrates how to scale an SQLite database under heavy write loads by utilizing Valkey as a distributed cache layer, combined with multi-threading via Node.js Cluster Mode or PM2.

## Important Note on Valkey vs Redis

Valkey is a fully compatible open-source fork of Redis (specifically, it is functionally equivalent to Redis). 

In this project, Valkey was selected instead of standard Redis because of an attempt to execute custom JavaScript scripts directly on the cache layer. However, it is important to note that this specific feature is not natively supported in standard Redis, though the core cache mechanisms remain identical. You can treat it as a drop-in replacement for Redis throughout this setup.
unfortunately this attempt has failed as valkey does not support javascript scripts yet on it's stable branch so the project uses on lua script in this path (src/valkey-scripts).also the js attempt is kept as a demonstration of that attempt. 

## Architectural Design

The application is structured following the Model-View-Controller (MVC) architectural pattern and adheres to clean architecture principles through Dependency Injection (DI):

* **Controller (`routes.ts`):** Acts as the entry point for HTTP requests. It handles routing, maps request contexts, validates inputs against structural interfaces, and sends responses back to the client.
* **Service (`service.ts`):** Houses the core business logic. It orchestrates the flow of data and validation constraints required to reserve a concert ticket. To promote decoupling, testability, and separation of concerns, **the Cache client and the Database connection are separated into two distinct modules/files and injected into the Service instance via its constructor.**
* **Models (src/entity):** Represent the data layout and database schema structures for the application state (e.g., Concerts, Tickets, Seats).
* **Data Transfer Objects DTOs (src/entity/dto):** TypeScript interfaces defined specifically to enforce and type-check inputs arriving at the route/controller boundary.

### High-Concurrency Strategy
SQLite is an excellent, lightweight database, but it natively struggles with concurrent write operations ("database is locked" errors). To overcome this limitation and make parallel requests viable, this architecture implements:

1. In-Memory Inventory (Valkey): Active seat availability is cached and managed atomically in Valkey. High-concurrency requests hit Valkey first to check and decrement availability before ever touching the disk.
2. Multi-Threaded Execution: The application utilizes Node.js clustering (via native cluster or PM2) to distribute incoming HTTP requests across all available CPU cores.

## Prerequisites & Infrastructure

Before running the application, ensure you have Node.js installed. You will also need a running Valkey instance.

For more detailed setup options, refer to the official [Valkey Installation Documentation](https://valkey.io/topics/installation/).

### Running Valkey via Docker

If you do not have Valkey installed locally, the easiest way to spin up an instance is using Docker:

```bash
# Pull and run the official Valkey image in the background
docker run --name valkey-cache -p 6379:6379 -d valkey/valkey
```

### Configuration (.env Setup)

The application relies on environment variables for database paths, cache credentials, and port configurations. A template configuration file is included in the root directory.

Create your local execution environment file by copying the template file:

```bash 
cp example.env .env
```

Open the newly created .env file and adjust the configuration parameters (such as database name, Valkey connection strings, or port configurations) to match your local runtime environment if necessary.

You can adjust the number of customers in the `TOTAL_REQUESTS=200` and the number of available seats in the `SEATS_NUM=10`

### What this project missed

## message broker 

It would have been better if we added a message broker like rabbitMQ rather then writing to the database directly this would have made things safer against failures as SQLite locks the entire database during write operations this is solved using the cache but I do not trust it 100%.

## eager loading 

I would have rather loaded all the seats to the cache even before the first customer has requested a seat also to make all the parallel requests compelety detached from what was happening in the database and I can write to the database using it's own pace this solution could have been paried with a message broker to make the cache handle the parallel requests entirely 




