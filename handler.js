const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");

const express = require("express");
const serverless = require("serverless-http");

const app = express();

const USERS_TABLE = process.env.USERS_TABLE;
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

app.use(express.json());

app.get("/users/:userId", async (req, res) => {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId,
    },
  };

  try {
    const command = new GetCommand(params);
    const { Item } = await docClient.send(command);
    if (Item) {
      const { userId, name } = Item;
      res.json({ userId, name });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find user with provided "userId"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retrieve user" });
  }
});

app.post("/users", async (req, res) => {
  const { userId, name } = req.body;
  if (typeof userId !== "string") {
    res.status(400).json({ error: '"userId" must be a string' });
  } else if (typeof name !== "string") {
    res.status(400).json({ error: '"name" must be a string' });
  }

  const params = {
    TableName: USERS_TABLE,
    Item: { userId, name },
  };

  try {
    const command = new PutCommand(params);
    await docClient.send(command);
    res.json({ userId, name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not create user" });
  }
});

// Create a new Candidate
app.post("/create", async (re, res) => {
  const { userId, name, password, email } = req.body;
  if (typeof userId !== "string" || typeof name !== "string" || typeof password !== "string" || typeof email !== "string") {
    res.status(400).json({ error: "Invalid input" });
  }

  const params = {
    TableName: USERS_TABLE,
    Item: { userId, name, password, email },
  };

  try {
    const command = new PutCommand(params);
    await docClient.send(command);
    res
      .status(201)
      .json({ message: "Successfully created a candidate!", data: { userId, name, email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not create user" });
  }
})
// Get all Candidates
app.get("/candidates", async (req, res) => {
  const params = {
    TableName: USERS_TABLE,
    ProjectionExpression: "userId, name, email",
  };
  try {
    const command = new ScanCommand(params);
    const {Items}= await docClient.send(command);
    res.status(200).json({
      status: ok,
      message: "Successfully retrieved all candidates",
      data: Items,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not retrieve candidates" });
  }

})
// Delete a candidate
app.delete("/delete/:userId", async (req, res) => {
  const params = {
    TableName: USERS_TABLE,
    key: {
      userId: req.params.userId,
    }
  }
  try {
    const command = new DeleteCommand(params);
    const deleteResult = await docClient.send(command);
    res.status(200).json({ message: "Successfully deleted candidate", data: deleteResult });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not delete candidate", error: error });
  }
})
app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

exports.handler = serverless(app);
