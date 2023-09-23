import express from "express";
const router = express.Router();

import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import schedule from "node-schedule";

const url =
  "https://raw.githubusercontent.com/LiveCoronaDetector/livecod/master/data/koreaRegionalData.js";
const tempFilePath = path.join(__dirname, "../dataset/temp-kcdc.js");
const exportModule = "module.exports = koreaRegionalData;";

let koreaRegionalData = {};

router.get("/brief", (req, res) => {
  res.status(200).json(koreaRegionalData);
});

const updateDataSet = async () => {
  console.log(`Korea KCDC Updated at ${new Date().toISOString()}`);

  try {
    const response = await fetch(url);
    const body = await response.text();

    fs.writeFile(tempFilePath, `${body}${exportModule}`, (err) => {
      if (err) {
        console.error(err);
        return;
      }

      try {
        delete require.cache[require.resolve(tempFilePath)];
        koreaRegionalData = require(tempFilePath);
        console.log("Korea KCDC data was saved!");
      } catch (e) {
        console.error(e);
        koreaRegionalData = {};
      }
    });
  } catch (e) {
    console.error(e);
    koreaRegionalData = {};
  }
};

schedule.scheduleJob("12 * * * *", updateDataSet); // Call every hour at 12 minutes
updateDataSet();

export default router;
