
console.log("✅ Seeding database...");

// Example stub logic
async function main() {
  // connect to MongoDB (later you’ll use your actual URI)
  // await mongoose.connect("mongodb://localhost:27017/whiteboard");
  // await User.create({ name: "test-user" });

  console.log("🎉 Database seeded successfully!");
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  return;
});
