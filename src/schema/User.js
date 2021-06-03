"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: Schema.Types.String, required: true },
  password: { type: Schema.Types.String, required: true },
  balance: { type: Schema.Types.Number, default: 10000 },
  curr_date: { type: Schema.Types.Number, default: 0 },
  stocks_owned: [
    {
      stock_name: { type: Schema.Types.String },
      tx_num: { type: Schema.Types.Number },
      qty_owned: { type: Schema.Types.Number }
    }
  ],
  stock_history: [
    {
      tx_num: { type: Schema.Types.Number },
      stock_name: { type: Schema.Types.String },
      quantity: { type: Schema.Types.Number },
      price: { type: Schema.Types.Number },
      type: { type: Schema.Types.String }
    }
  ],
  tx_num: { type: Schema.Types.Number, default: 1 }
});

UserSchema.statics.create = data => {
  return new User(data);
};

const User = mongoose.model("User", UserSchema);
module.exports = User;
