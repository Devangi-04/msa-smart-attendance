/**
 * Firestore Adapter
 * This adapter makes Firestore work like Prisma, so your existing code doesn't need major changes
 */

const { adminDb } = require('../config/firebaseAdmin');
const { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} = require('firebase/firestore');

class FirestoreAdapter {
  constructor() {
    this.db = adminDb;
  }

  // User operations
  user = {
    create: async ({ data }) => {
      const docRef = await this.db.collection('users').add({
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      const doc = await docRef.get();
      return { id: docRef.id, ...doc.data() };
    },

    findUnique: async ({ where }) => {
      if (where.id) {
        const doc = await this.db.collection('users').doc(where.id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
      }
      if (where.email) {
        const snapshot = await this.db.collection('users')
          .where('email', '==', where.email)
          .limit(1)
          .get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    },

    findMany: async ({ where = {}, orderBy: order, take, skip } = {}) => {
      let queryRef = this.db.collection('users');
      
      if (where.role) {
        queryRef = queryRef.where('role', '==', where.role);
      }
      
      if (order) {
        const field = Object.keys(order)[0];
        const direction = order[field];
        queryRef = queryRef.orderBy(field, direction);
      }
      
      if (skip) queryRef = queryRef.offset(skip);
      if (take) queryRef = queryRef.limit(take);
      
      const snapshot = await queryRef.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    update: async ({ where, data }) => {
      const docRef = this.db.collection('users').doc(where.id);
      await docRef.update({
        ...data,
        updatedAt: Timestamp.now()
      });
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() };
    },

    delete: async ({ where }) => {
      await this.db.collection('users').doc(where.id).delete();
      return { id: where.id };
    },

    count: async ({ where = {} } = {}) => {
      let queryRef = this.db.collection('users');
      if (where.role) {
        queryRef = queryRef.where('role', '==', where.role);
      }
      const snapshot = await queryRef.get();
      return snapshot.size;
    },

    upsert: async ({ where, create, update }) => {
      const existing = await this.user.findUnique({ where });
      if (existing) {
        return await this.user.update({ where, data: update });
      }
      return await this.user.create({ data: create });
    }
  };

  // Event operations
  event = {
    create: async ({ data, include }) => {
      const eventData = {
        ...data,
        date: data.date instanceof Date ? Timestamp.fromDate(data.date) : Timestamp.now(),
        endDate: data.endDate ? Timestamp.fromDate(new Date(data.endDate)) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await this.db.collection('events').add(eventData);
      const doc = await docRef.get();
      let result = { id: docRef.id, ...doc.data() };
      
      if (include?.createdBy) {
        result.createdBy = await this.user.findUnique({ where: { id: data.createdById } });
      }
      
      return result;
    },

    findUnique: async ({ where, include }) => {
      const doc = await this.db.collection('events').doc(where.id.toString()).get();
      if (!doc.exists) return null;
      
      let result = { id: doc.id, ...doc.data() };
      
      if (include?.createdBy) {
        result.createdBy = await this.user.findUnique({ where: { id: result.createdById } });
      }
      
      if (include?.attendance) {
        result.attendance = await this.attendance.findMany({ 
          where: { eventId: parseInt(doc.id) },
          include: include.attendance.include
        });
      }
      
      if (include?._count) {
        const attendanceSnapshot = await this.db.collection('attendance')
          .where('eventId', '==', parseInt(doc.id))
          .get();
        result._count = { attendance: attendanceSnapshot.size };
      }
      
      return result;
    },

    findMany: async ({ where = {}, include, orderBy: order, take, skip } = {}) => {
      let queryRef = this.db.collection('events');
      
      if (where.status) {
        queryRef = queryRef.where('status', '==', where.status);
      }
      
      if (where.date?.gte) {
        queryRef = queryRef.where('date', '>=', Timestamp.fromDate(new Date(where.date.gte)));
      }
      
      if (order) {
        const field = Object.keys(order)[0];
        const direction = order[field] === 'desc' ? 'desc' : 'asc';
        queryRef = queryRef.orderBy(field, direction);
      }
      
      if (skip) queryRef = queryRef.offset(skip);
      if (take) queryRef = queryRef.limit(take);
      
      const snapshot = await queryRef.get();
      const events = [];
      
      for (const doc of snapshot.docs) {
        let event = { id: doc.id, ...doc.data() };
        
        if (include?.createdBy) {
          event.createdBy = await this.user.findUnique({ where: { id: event.createdById } });
        }
        
        if (include?._count) {
          const attendanceSnapshot = await this.db.collection('attendance')
            .where('eventId', '==', parseInt(doc.id))
            .get();
          event._count = { attendance: attendanceSnapshot.size };
        }
        
        events.push(event);
      }
      
      return events;
    },

    update: async ({ where, data, include }) => {
      const docRef = this.db.collection('events').doc(where.id.toString());
      const updateData = {
        ...data,
        updatedAt: Timestamp.now()
      };
      
      if (data.date) {
        updateData.date = Timestamp.fromDate(new Date(data.date));
      }
      if (data.endDate) {
        updateData.endDate = Timestamp.fromDate(new Date(data.endDate));
      }
      
      await docRef.update(updateData);
      return await this.event.findUnique({ where, include });
    },

    delete: async ({ where }) => {
      // Delete associated attendance records first
      const attendanceSnapshot = await this.db.collection('attendance')
        .where('eventId', '==', parseInt(where.id))
        .get();
      
      const batch = this.db.batch();
      attendanceSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      
      // Delete the event
      await this.db.collection('events').doc(where.id.toString()).delete();
      return { id: where.id };
    },

    count: async ({ where = {} } = {}) => {
      let queryRef = this.db.collection('events');
      
      if (where.status) {
        queryRef = queryRef.where('status', '==', where.status);
      }
      if (where.date?.gte) {
        queryRef = queryRef.where('date', '>=', Timestamp.fromDate(new Date(where.date.gte)));
      }
      
      const snapshot = await queryRef.get();
      return snapshot.size;
    }
  };

  // Attendance operations
  attendance = {
    create: async ({ data, include }) => {
      const attendanceData = {
        ...data,
        markedAt: Timestamp.now()
      };
      
      const docRef = await this.db.collection('attendance').add(attendanceData);
      const doc = await docRef.get();
      let result = { id: docRef.id, ...doc.data() };
      
      if (include?.event) {
        result.event = await this.event.findUnique({ 
          where: { id: data.eventId },
          include: include.event.select ? { select: include.event.select } : undefined
        });
      }
      
      if (include?.user) {
        result.user = await this.user.findUnique({ 
          where: { id: data.userId },
          include: include.user.select ? { select: include.user.select } : undefined
        });
      }
      
      return result;
    },

    findFirst: async ({ where, include }) => {
      let queryRef = this.db.collection('attendance');
      
      if (where.eventId) {
        queryRef = queryRef.where('eventId', '==', where.eventId);
      }
      if (where.userId) {
        queryRef = queryRef.where('userId', '==', where.userId);
      }
      
      const snapshot = await queryRef.limit(1).get();
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      let result = { id: doc.id, ...doc.data() };
      
      if (include?.event) {
        result.event = await this.event.findUnique({ where: { id: result.eventId } });
      }
      if (include?.user) {
        result.user = await this.user.findUnique({ where: { id: result.userId } });
      }
      
      return result;
    },

    findMany: async ({ where = {}, include, orderBy: order, take, skip } = {}) => {
      let queryRef = this.db.collection('attendance');
      
      if (where.eventId) {
        queryRef = queryRef.where('eventId', '==', where.eventId);
      }
      if (where.userId) {
        queryRef = queryRef.where('userId', '==', where.userId);
      }
      
      if (order) {
        const field = Object.keys(order)[0];
        const direction = order[field] === 'desc' ? 'desc' : 'asc';
        queryRef = queryRef.orderBy(field, direction);
      }
      
      if (skip) queryRef = queryRef.offset(skip);
      if (take) queryRef = queryRef.limit(take);
      
      const snapshot = await queryRef.get();
      const attendance = [];
      
      for (const doc of snapshot.docs) {
        let record = { id: doc.id, ...doc.data() };
        
        if (include?.event) {
          record.event = await this.event.findUnique({ where: { id: record.eventId } });
        }
        if (include?.user) {
          record.user = await this.user.findUnique({ where: { id: record.userId } });
        }
        
        attendance.push(record);
      }
      
      return attendance;
    },

    delete: async ({ where }) => {
      await this.db.collection('attendance').doc(where.id.toString()).delete();
      return { id: where.id };
    },

    count: async ({ where = {} } = {}) => {
      let queryRef = this.db.collection('attendance');
      
      if (where.eventId) {
        queryRef = queryRef.where('eventId', '==', where.eventId);
      }
      if (where.userId) {
        queryRef = queryRef.where('userId', '==', where.userId);
      }
      
      const snapshot = await queryRef.get();
      return snapshot.size;
    }
  };

  // Helper method to disconnect (for compatibility)
  $disconnect = async () => {
    console.log('Firestore adapter: No disconnect needed');
  };
}

// Export singleton instance
const firestoreAdapter = new FirestoreAdapter();
module.exports = firestoreAdapter;
