const seedSampleData = async (req, res) => {
  return res.status(410).json({
    error: "Sample data seeding has been disabled. Use CSV upload to provide production datasets.",
  });
};

module.exports = {
  seedSampleData,
};
