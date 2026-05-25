#!lua name=ticket_library
-- The header above is required. This code executes atomically inside the Valkey engine.

local function tryReserveSeat(keys, args)
    local seatKey = keys[1] -- Heads up: Lua arrays are 1-indexed, not 0-indexed!
    local userId = args[1]

    -- 'NX' tells Valkey: Only set this key if it doesn't have a value (is null/empty)
    -- redis.call is the built-in API Valkey uses to execute commands internally
    local result = redis.call('set', seatKey, userId, 'NX')

    -- If the key was already taken, SET ... NX returns false/nil
    if not result then
        return -1 -- Status: Seat is already taken
    end

    return 1 -- Status: Success!
end

-- Register the function to the library namespace
server.register_function('tryReserveSeat', tryReserveSeat)