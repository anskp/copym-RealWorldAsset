const { PrismaClient } = require('@prisma/client');

// Create a global instance of PrismaClient to avoid multiple instances in development
const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') global.prisma = prisma;

module.exports = { prisma };