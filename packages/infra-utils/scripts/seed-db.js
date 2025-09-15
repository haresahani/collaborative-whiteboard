"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
console.log("✅ Seeding database...");
// Example stub logic
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // connect to MongoDB (later you’ll use your actual URI)
        // await mongoose.connect("mongodb://localhost:27017/whiteboard");
        // await User.create({ name: "test-user" });
        console.log("🎉 Database seeded successfully!");
    });
}
main().catch((err) => {
    console.error("❌ Seeding failed:", err);
    return;
});
