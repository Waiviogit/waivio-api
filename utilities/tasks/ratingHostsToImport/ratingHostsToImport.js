const mongoose = require('mongoose');

const PageRankSchema = new mongoose.Schema({
  page_rank_integer: {
    type: Number,
    required: true,
  },
  page_rank_decimal: {
    type: Number,
    required: true,
  },
  rank: {
    type: String,
  },
  domain: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
}, {
  timestamps: false, versionKey: false,
});
PageRankSchema.index({ page_rank_decimal: -1 });

const PageImportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  fieldUrl: {
    type: String,
    required: true,
  },
  fieldRating: {
    type: Number,
    required: true,
  },
}, {
  timestamps: false, versionKey: false,
});

const ratingHostsToImport = async (rank = 6) => {
  try {
    const connection = await mongoose.connect('mongodb://localhost:27017/page_rank');
    const PageRank = connection.model('PageRank', PageRankSchema);
    const PageImport = connection.model('PageImport', PageImportSchema);

    const pages = await PageRank.find({
      page_rank_decimal: { $gte: Number(rank) },
    }).sort({ _id: 1 }).lean();
    if (pages.length === 0) return;

    const mappedObjects = pages.map((el) => ({ name: el.domain, fieldUrl: `https://${el.domain}`, fieldRating: 5 }));
    await PageImport.insertMany(mappedObjects);
  } catch (error) {
    console.error(error);
  }
};

module.exports = { ratingHostsToImport };
