/ Global Variables
const API_URL = 'http://localhost:3000';
let currentSlots = [];

// DOM Elements
const timeSlotsContainer = document.getElementById('time-slots-container');
const bookingModal = document.getElementById('booking-modal');
const confirmModal = document.getElementById('confirm-modal');
const bookingForm = document.getElementById('booking-form');
const slotIdInput = document.getElementById('slot-id');
const timeDisplay = document.getElementById('time-display');
const nameInput = document.getElementById('name');
const cancelTimeDisplay = document.getElementById('cancel-time');
const cancelNameDisplay = document.getElementById('cancel-name');
const confirmCancelBtn = document.getElementById('confirm-cancel');
const cancelActionBtn = document.getElementById('cancel-action');

// Close buttons for modals
const closeButtons = document.querySelectorAll('.close-button');
closeButtons.forEach(button => {
  button.addEventListener('click', () => {
    bookingModal.style.display = 'none';
    confirmModal.style.display = 'none';
  });
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  fetchTimeSlots();
});

// Fetch all time slots from the API
async function fetchTimeSlots() {
  try {
    const response = await fetch(`${API_URL}/slots`);
    if (!response.ok) {
      throw new Error('Failed to fetch time slots');
    }
    
    const slots = await response.json();
    currentSlots = slots;
    renderTimeSlots(slots);
  } catch (error) {
    showNotification('Error loading time slots. Please try again.', true);
    console.error('Error fetching time slots:', error);
  }
}

// Render time slots to the DOM
function renderTimeSlots(slots) {
  timeSlotsContainer.innerHTML = '';
  
  if (slots.length === 0) {
    timeSlotsContainer.innerHTML = '<div class="no-slots">No time slots available</div>';
    return;
  }
  
  slots.forEach(slot => {
    const slotElement = document.createElement('div');
    slotElement.className = `slot ${slot.status === 'available' ? 'slot-available' : 'slot-booked'}`;
    
    slotElement.innerHTML = `
      <div class="slot-time">${slot.time}</div>
      <div class="slot-status">${slot.status === 'available' ? 'Available' : 'Booked'}</div>
      ${slot.status === 'booked' ? `<div class="slot-booker">Booked by: ${slot.bookedBy}</div>` : ''}
      <div class="slot-actions">
        ${slot.status === 'available' 
          ? `<button class="btn btn-primary btn-block book-btn" data-id="${slot.id}" data-time="${slot.time}">Book Now</button>` 
          : `<button class="btn btn-danger btn-block cancel-btn" data-id="${slot.id}" data-time="${slot.time}" data-booker="${slot.bookedBy}">Cancel Booking</button>`
        }
      </div>
    `;
    
    timeSlotsContainer.appendChild(slotElement);
  });
  
  // Add event listeners to the newly created buttons
  addButtonEventListeners();
}

// Add event listeners to booking and cancel buttons
function addButtonEventListeners() {
  // Book buttons
  const bookButtons = document.querySelectorAll('.book-btn');
  bookButtons.forEach(button => {
    button.addEventListener('click', () => {
      const slotId = button.getAttribute('data-id');
      const time = button.getAttribute('data-time');
      openBookingModal(slotId, time);
    });
  });
  
  // Cancel buttons
  const cancelButtons = document.querySelectorAll('.cancel-btn');
  cancelButtons.forEach(button => {
    button.addEventListener('click', () => {
      const slotId = button.getAttribute('data-id');
      const time = button.getAttribute('data-time');
      const booker = button.getAttribute('data-booker');
      openConfirmModal(slotId, time, booker);
    });
  });
}

// Open the booking modal
function openBookingModal(slotId, time) {
  slotIdInput.value = slotId;
  timeDisplay.textContent = time;
  nameInput.value = '';
  
  bookingModal.style.display = 'flex';
  nameInput.focus();
}

// Open the confirmation modal for cancellation
function openConfirmModal(slotId, time, booker) {
  cancelTimeDisplay.textContent = time;
  cancelNameDisplay.textContent = booker;
  
  // Store the slot ID for later use
  confirmCancelBtn.setAttribute('data-id', slotId);
  
  confirmModal.style.display = 'flex';
}

// Handle booking form submission
bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const slotId = slotIdInput.value;
  const name = nameInput.value.trim();
  
  if (!name) {
    showNotification('Please enter your name', true);
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ slotId, name })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to book the slot');
    }
    
    bookingModal.style.display = 'none';
    showNotification('Slot booked successfully!');
    
    // Refresh the time slots
    fetchTimeSlots();
  } catch (error) {
    showNotification(error.message, true);
    console.error('Error booking slot:', error);
  }
});

// Handle confirmation of cancellation
confirmCancelBtn.addEventListener('click', async () => {
  const slotId = confirmCancelBtn.getAttribute('data-id');
  
  try {
    const response = await fetch(`${API_URL}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ slotId })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to cancel the booking');
    }
    
    confirmModal.style.display = 'none';
    showNotification('Booking cancelled successfully!');
    
    // Refresh the time slots
    fetchTimeSlots();
  } catch (error) {
    showNotification(error.message, true);
    console.error('Error cancelling booking:', error);
  }
});

// Cancel the cancellation action
cancelActionBtn.addEventListener('click', () => {
  confirmModal.style.display = 'none';
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === bookingModal) {
    bookingModal.style.display = 'none';
  }
  if (e.target === confirmModal) {
    confirmModal.style.display = 'none';
  }
});

// Show notification
function showNotification(message, isError = false) {
  // Remove existing notification if any
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    document.body.removeChild(existingNotification);
  }
  
  // Create new notification
  const notification = document.createElement('div');
  notification.className = `notification ${isError ? 'error' : ''}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Show the notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Hide the notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}
