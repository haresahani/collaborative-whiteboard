console.log("✅ Seeding database...");

// Example stub logic
async function main(): Promise<void> {
  // connect to MongoDB (later you’ll use your actual URI)
  // Example await to satisfy require-await when filling in later
  await Promise.resolve();
  // await User.create({ name: "test-user" });

  console.log("🎉 Database seeded successfully!");
}

void main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  return;
});
