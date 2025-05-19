const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('../frontend'));

// In-memory storage for slots
const timeSlots = [];

// Initialize time slots (10 AM to 5 PM, 1-hour intervals)
function initializeTimeSlots() {
  const startHour = 10; // 10 AM
  const endHour = 17;   // 5 PM
  
  for (let hour = startHour; hour < endHour; hour++) {
    const slot = {
      id: hour - startHour,
      time: `${hour}:00 - ${hour + 1}:00`,
      status: 'available',
      bookedBy: null
    };
    timeSlots.push(slot);
  }
}

// Initialize slots when server starts
initializeTimeSlots();

// GET /slots - Return list of all time slots with booking status
app.get('/slots', (req, res) => {
  res.json(timeSlots);
});

// POST /book - Book a slot
app.post('/book', (req, res) => {
  const { slotId, name } = req.body;
  
  if (!slotId || !name) {
    return res.status(400).json({ error: 'Slot ID and name are required' });
  }
  
  const slotIndex = timeSlots.findIndex(slot => slot.id === parseInt(slotId));
  
  if (slotIndex === -1) {
    return res.status(404).json({ error: 'Slot not found' });
  }
  
  if (timeSlots[slotIndex].status === 'booked') {
    return res.status(400).json({ error: 'Slot is already booked' });
  }
  
  // Book the slot
  timeSlots[slotIndex].status = 'booked';
  timeSlots[slotIndex].bookedBy = name;
  
  res.json(timeSlots[slotIndex]);
});

// POST /cancel - Cancel a booking
app.post('/cancel', (req, res) => {
  const { slotId } = req.body;
  
  if (!slotId) {
    return res.status(400).json({ error: 'Slot ID is required' });
  }
  
  const slotIndex = timeSlots.findIndex(slot => slot.id === parseInt(slotId));
  
  if (slotIndex === -1) {
    return res.status(404).json({ error: 'Slot not found' });
  }
  
  if (timeSlots[slotIndex].status === 'available') {
    return res.status(400).json({ error: 'Slot is not booked' });
  }
  
  // Cancel the booking
  timeSlots[slotIndex].status = 'available';
  timeSlots[slotIndex].bookedBy = null;
  
  res.json(timeSlots[slotIndex]);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the application`);
});
