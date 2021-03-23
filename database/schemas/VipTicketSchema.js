const mongoose = require('mongoose');

const { Schema } = mongoose;

const VipTicketSchema = new Schema({
  userName: { type: String, required: true, index: true },
  ticket: { type: String, required: true, unique: true },
  valid: { type: Boolean, default: true },
  note: { type: String },
}, { versionKey: false, timestamps: true });

const VipTicketModel = mongoose.model('vipTickets', VipTicketSchema, 'vip_tickets');

module.exports = VipTicketModel;
