import express from "express";
import { getNomenclature } from "../controllers/config.controller.js";

const configRoute = express.Router();

configRoute.get("/nomenclature", getNomenclature);

export default configRoute;
