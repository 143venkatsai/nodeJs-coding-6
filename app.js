const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Converting State DB Object to Response Object

const convertMovieDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

//Converting District DB Object to Response Object

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//Converting State Statistics Report

const convertStateReportDbToResponse = (dbObject) => {
  return {
    totalCases: dbObject.cases,
    totalCured: dbObject.cured,
    totalActive: dbObject.active,
    totalDeaths: dbObject.deaths,
  };
};

//Get States API 1

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state;
    `;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) =>
      convertMovieDbObjectToResponseObject(eachState)
    )
  );
});

//Get State API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
      SELECT * FROM state WHERE state_id = ${stateId};`;
  const getState = await db.get(getStateQuery);
  response.send(convertMovieDbObjectToResponseObject(getState));
});

//Add District API 3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
      INSERT INTO 
        district(district_name,state_id,cases,cured,active,deaths)
      VALUES 
        ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const district = await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//Get District APi 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
      * 
    FROM 
      district 
    WHERE 
      district_id = ${districtId};`;
  const getDistrict = await db.get(getDistrictQuery);
  response.send(convertDistrictDbObjectToResponseObject(getDistrict));
});

//Delete District APi 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district 
    WHERE district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//update District API 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
    UPDATE district 
    SET 
      district_name = '${districtName}',
      state_id = ${stateId},
      cases = ${cases},
      cured = ${cured},
      active = ${active},
      deaths = ${deaths};
    WHERE 
      district_id = ${districtId};`;
  const updateDistrict = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//GET State Statistics API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateReport = `
    SELECT SUM(cases) AS cases,
        SUM(cured) AS cured,
        SUM(active) AS active,
        SUM(deaths) AS deaths
    FROM district
    WHERE 
      state_id = ${stateId};`;
  const stateReport = await db.get(getStateReport);
  const resultReport = convertStateReportDbToResponse(stateReport);
  response.send(resultReport);
});

//Get State Name API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
      SELECT state_name 
      FROM state JOIN district 
      WHERE 
       district_id = ${districtId};`;
  const stateName = await db.get(getStateNameQuery);
  response.send({ stateName: stateName.state_name });
});

module.exports = app;
