import { scheduleTask, start } from "./bot";
import dotenv from "dotenv";
import startMongo from "./utils/start-mongo";
import cron from 'node-cron';
dotenv.config();
startMongo()
	.then(() => {
		console.log("MongoDB connected");
		start().catch((err) => {
			console.error(err);
			process.exit(1);
		});
		cron.schedule('0 0 * * *', async () => {
			await scheduleTask();
		});
	})
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
