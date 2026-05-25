#!js name=ticket_library engine=v8
/* global valkey */

function tryReserveSeat(keys, args) {
    const seatKey = keys[0]; // e.g., 'seat:row_A_12'
    const userId = args[0];  // e.g., 'user_9872'

    // 'NX' ensures we only set the key if it doesn't already have a value.
    // returns OK string if successful, or null if the key already exists.
    const result = valkey.call('set', seatKey, userId, 'NX');

    if (result === null) {
        return -1; // Status: Seat is already taken in the cache
    }

    return 1; // Status: Success!
}

valkey.register_function('reserveSeat', tryReserveSeat);