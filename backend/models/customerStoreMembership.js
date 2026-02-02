const mongoose = require('mongoose');

const customerStoreMembershipSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// One membership per customer per store
customerStoreMembershipSchema.index({ customer: 1, store: 1 }, { unique: true });
customerStoreMembershipSchema.index({ store: 1, createdAt: -1 });

module.exports = mongoose.model('CustomerStoreMembership', customerStoreMembershipSchema);

