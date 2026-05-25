
import { Router } from 'express';

import Services from './service';

export default function buildRoutes(service: Services) {
    const router = Router();

    router.post('/events/:id/purchase', async (req, res) => {
        const eventId = parseInt(req.params.id);
        const seat: BookingSeat = req.body;
        // console.log(body)
        const sc = await service.bookSeatEvent(eventId, seat);

        res.send(sc);
    });

    return router;
}
