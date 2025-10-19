// Quick script to generate bcrypt password hash
// Usage: node generate-password-hash.js YourPassword123

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
    console.log('\n❌ Error: Please provide a password');
    console.log('\nUsage: node generate-password-hash.js YourPassword123\n');
    process.exit(1);
}

if (password.length < 6) {
    console.log('\n⚠️  Warning: Password should be at least 6 characters long\n');
}

const hash = bcrypt.hashSync(password, 10);

console.log('\n✅ Password Hash Generated Successfully!\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📝 Original Password:', password);
console.log('\n🔐 Bcrypt Hash:');
console.log(hash);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n💡 Use this hash when creating users in Prisma Studio');
console.log('   or when inserting directly into the database.\n');
