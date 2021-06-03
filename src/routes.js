"use strict";

const express = require("express");
const router = express.Router();
const utils = require("../config/utilities");
const User = require("./schema/User");

router.route("/").get((_req, res) => {
  console.log("GET /");
  res.status(200).send({
    data: "App is running."
  });
});

router
  .route("/user")
  .get((req, res) => {
    User.find({}).then(users => {
      res.status(200).send(users);
    });
  })
  .post((req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
      return res.status(400).send("Username and/or password not passed in");
    }

    const userJSON = {
      username: username,
      password: password
    };

    User.create(userJSON).save();
    res.status(200).send("User created successfully");
  });

router.route("/stocks").post((req, res) => {
  // 1. Increase trx num
  // 2. Change balance (and verify)
  // 3. Update stock history
  // 4. Update curr stocks (if stock num equals 0, remove from curr stocks)

  const id = req.body.id;
  const stock_name = req.body.stock_name;
  const quantity = req.body.quantity;
  const price = req.body.price;
  const type = req.body.type;
  const value = req.body.value;

  if (!id || !stock_name || !quantity || !price || !type || !value) {
    return res.status(400).send("Invalid arguments");
  }

  User.findById(id)
    .then(results => {
      if (type == "buy") {
        var triggered = false;
        if (results["balance"] < value) {
          return res.status(404).send("Insufficient Balance");
        }
        for (var i = 0; i < results["stocks_owned"].length; i++) {
          var stock = results["stocks_owned"][i];

          // Case 1: User has purchased stock before
          if (stock["stock_name"] === stock_name) {
            triggered = true;
            var stocks_owned_state = results["stocks_owned"];

            stocks_owned_state[i] = {
              stock_name: stock_name,
              tx_num: results["tx_num"],
              qty_owned: stock["qty_owned"] + quantity
            };

            //console.log(stocks_owned_state);

            var stock_history_state = results["stock_history"];
            stock_history_state.push({
              tx_num: results["tx_num"],
              stock_name: stock_name,
              quantity: quantity,
              price: price,
              type: type
            });

            const new_state = {
              balance: results["balance"] - value,
              stocks_owned: stocks_owned_state,
              tx_num: results["tx_num"] + 1,
              stock_history: stock_history_state
            };
            User.findByIdAndUpdate(id, new_state, { new: true })
              .then(data => {
                res.status(200).send(data);
              })
              .catch(err => {
                ees.status(400).send("Could not update user after purchase");
              });
            break;
          }
        }
        // User has never purchased the stock before
        if (!triggered) {
          var stocks_owned_state = results["stocks_owned"];

          stocks_owned_state.push({
            stock_name: stock_name,
            tx_num: results["tx_num"],
            qty_owned: quantity
          });

          var stock_history_state = results["stock_history"];
          stock_history_state.push({
            tx_num: results["tx_num"],
            stock_name: stock_name,
            quantity: quantity,
            price: price,
            type: type
          });

          const new_state = {
            balance: results["balance"] - value,
            stocks_owned: stocks_owned_state,
            tx_num: results["tx_num"] + 1,
            stock_history: stock_history_state
          };
          User.findByIdAndUpdate(id, new_state, { new: true })
            .then(data => {
              res.status(200).send(data);
            })
            .catch(err => {
              console.log(err);
              res.status(400).send("Could not update user after purchase");
            });
        }
      } else if (type == "sell") {
        var triggered = false;
        for (var i = 0; i < results["stocks_owned"].length; i++) {
          var stock = results["stocks_owned"][i];
          if (stock["stock_name"] === stock_name) {
            triggered = true;
            if (stock["qty_owned"] < quantity) {
              return res.status(400).send("You dont have that many shares!");
            }
            var stocks_owned_state = results["stocks_owned"];

            stocks_owned_state[i] = {
              stock_name: stock_name,
              tx_num: results["tx_num"],
              qty_owned: stock["qty_owned"] - quantity
            };

            var stock_history_state = results["stock_history"];
            stock_history_state.push({
              tx_num: results["tx_num"],
              stock_name: stock_name,
              quantity: quantity,
              price: price,
              type: type
            });

            const new_state = {
              balance: results["balance"] + value,
              stocks_owned: stocks_owned_state,
              tx_num: results["tx_num"] + 1,
              stock_history: stock_history_state
            };

            User.findByIdAndUpdate(id, new_state, { new: true })
              .then(data => {
                res.status(200).send(data);
              })
              .catch(err => {
                console.log(err);
                res.status(400).send("Could not update user after purchase");
              });
            break;
          }
        }
        if (!triggered) {
          res.status(404).send("Selling stock error");
        }
      } else {
        res.status(400).send("Invalid Purchase Type");
      }
    })
    .catch(err => {
      res.status(404).send("User not found with given id");
    });
});

router.route("/nextday").post((req, res) => {
  const id = req.body.id;
  if (!id) {
    return res.status(400).send("ID not passed in");
  }
  User.findById(id)
    .then(results => {
      const new_state = {
        curr_date: results["curr_date"] + 1
      };

      User.findByIdAndUpdate(id, new_state, { new: true })
        .then(data => {
          res.status(200).send(data);
        })
        .catch(err => {
          console.log(err);
          res.status(400).send("Could not update user after purchase");
        });
    })
    .catch(err => res.status(404).send("ID not found"));
});

module.exports = router;
