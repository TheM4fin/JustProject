const mongoose = require("mongoose");
const express = require("express");
const app = express();
const Joi = require("joi");

app.use(express.json());

mongoose
  .connect("mongodb://localhost:27017/arrowsDB", { useNewUrlParser: true })
  .then(() => console.log("Connected to MongoDB!"))
  .catch((error) => console.error("Could not connect to MongoDB... ", error));

app.listen(3000, () => console.log("Listening on port 3000..."));

const arrowSchema = new mongoose.Schema({
  no: Number,
  owner: String,
  xPosition: Number,
  yPosition: Number,
  dateAdded: {
    type: Date,
    default: Date.now,
  },
});

const Arrow = mongoose.model("Arrow", arrowSchema);

app.get("/api/arrows", (req, res) => {
  const { error } = validateGet(req.query);
  if (error) {
    res.status(404).send(error.details[0].message);
    return;
  }

  let dbQuery = Arrow.find();

  if (req.query.limit) dbQuery = dbQuery.limit(parseInt(req.query.limit));

  dbQuery
    .then((arrows) => {
      res.json(arrows);
    })
    .catch((err) => {
      res.status(400).send("Some error");
    });
});

app.post("/api/arrows", (req, res) => {
  const { error } = validateArrow(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
  } else {
    Arrow.create(req.body)
      .then((result) => {
        res.json(result);
      })
      .catch((err) => {
        res.send("Arrow could not be created");
      });
  }
});

app.post("/api/arrowsPosition", (req, res) => {
  const { error } = validateArrowPosition(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
  } else {
    let dbQuery = Arrow.find();

    dbQuery = dbQuery.where("no", req.body.ArrowNo);
    dbQuery = dbQuery.where("owner", req.body.ArrowOwner);

    dbQuery
      .then((arrows) => {
        let xPosition = 0;
        let yPosition = 0;

        arrows.forEach((arrow) => {
          xPosition += arrow.xPosition;
          yPosition += arrow.yPosition;
        });

        xPosition = xPosition / arrows.length;
        yPosition = yPosition / arrows.length;

        res.json({
          ArrowNo: req.body.ArrowNo,
          ArrowOwner: req.body.ArrowOwner,
          yPosition: xPosition,
          xPosition: yPosition,
        });
      })
      .catch((err) => {
        res.status(400).send("Some error");
      });
  }
});

function validateGet(getData) {
  const schema = Joi.object({
    limit: Joi.number().min(1),
  });
  return schema.validate(getData, { presence: "optional" });
}

function validateArrow(arrow, allRequired = true) {
  const schema = Joi.object({
    no: Joi.number(),
    owner: Joi.string().min(3),
    xPosition: Joi.number(),
    yPosition: Joi.number(),
  });
  return schema.validate(arrow, {
    presence: allRequired ? "required" : "optional",
  });
}

function validateArrowPosition(arrowPosition) {
  const schema = Joi.object({
    ArrowNo: Joi.number(),
    ArrowOwner: Joi.string().min(3),
  });
  return schema.validate(arrowPosition, {
    presence: "required",
  });
}
