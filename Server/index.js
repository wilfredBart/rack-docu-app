import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './config/database.js';

import authRoute from './API/routes/authRoute.js';
import customersRoute from './API/routes/customerRoute.js';
import sitesRoute from './API/routes/siteRoute.js';
import locationsRoute from './API/routes/locationRoute.js';
import racksRoute from './API/routes/rackRoute.js';
import devicesRoute from './API/routes/deviceRoute.js';
import deviceTypesRoute from './API/routes/deviceTypeRoute.js';
import patchPanelsRoute from './API/routes/patchPanelRoute.js';
import cableManagementRoute from './API/routes/cableManagementRoute.js';
import portsRoute from './API/routes/portRoute.js';
import connectionsRoute from './API/routes/connectionRoute.js';

import errorHandler from './middleware/errorHandler.js';
import notFoundHandler from './middleware/notFoundHandler.js';
import authenticate from './middleware/authenticate.js';
import localOnly from './middleware/localOnly.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}));
app.use(express.json());

// Serveert ENKEL de css-submap publiek (voor recovery.html en help.html).
// Bewust NIET de hele /public map, anders zou iemand /recovery.html
// rechtstreeks kunnen opvragen en zo de localOnly-check op /recovery omzeilen.
app.use('/css', express.static('public/css'));

app.use('/auth', authRoute);

// Statische recovery-pagina — enkel bereikbaar vanaf de server zelf (localhost).
// Onafhankelijk van login/JWT, exact zoals bedoeld voor noodherstel.
app.get('/recovery', localOnly, (req, res) => {
    res.sendFile('recovery.html', { root: './public' });
});

// Statische help-pagina — overal toegankelijk, geen login nodig.
app.get('/help', (req, res) => {
    res.sendFile('help.html', { root: './public' });
});

app.use(authenticate); // vanaf hier is ALLES hieronder verplicht ingelogd

app.use('/customers', customersRoute);
app.use('/sites', sitesRoute);
app.use('/locations', locationsRoute);
app.use('/racks', racksRoute);
app.use('/devices', devicesRoute);
app.use('/device-types', deviceTypesRoute);
app.use('/patch-panels', patchPanelsRoute);
app.use('/cable-management', cableManagementRoute);
app.use('/ports', portsRoute);
app.use('/connections', connectionsRoute);

app.use(notFoundHandler); // vangt onbekende routes op
app.use(errorHandler);    // vangt alle errors op — altijd als laatste!

app.listen(port, () => {
    console.log(`🖥️ \t Server draait op http://localhost:${port}`);
});
