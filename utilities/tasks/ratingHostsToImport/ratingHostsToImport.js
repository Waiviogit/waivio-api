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

const PAGES_LIMIT = 1000;

const ratingHostsToImport = async (rank = 8) => {
  try {
    const connection = await mongoose.connect('mongodb://localhost:27017/page_rank');
    const PageRank = connection.model('PageRank', PageRankSchema);
    const PageImport = connection.model('PageImport', PageImportSchema);

    while (true) {
      const pages = await PageRank.find({
        page_rank_decimal: { $gte: Number(rank) },
      }).sort({ _id: 1 }).limit(PAGES_LIMIT).lean();
      if (pages.length === 0) break;

      const mappedObjects = pages.map((el) => ({ name: el.domain, fieldUrl: `https://${el.domain}`, fieldRating: el.page_rank_decimal / 2 }));
      await PageImport.insertMany(mappedObjects);
    }
  } catch (error) {
    console.error(error);
  }
};

module.exports = { ratingHostsToImport };
