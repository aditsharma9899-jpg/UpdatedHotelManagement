// Global Variables
const rooms = {
    first: [
        { number: '101', status: 'available', price: 1000 },
        { number: '102', status: 'available', price: 1000 },
        { number: '103', status: 'available', price: 1200 }
    ],
    second: [
        { number: '201', status: 'available', price: 1500 },
        { number: '202', status: 'available', price: 1500 },
        { number: '203', status: 'available', price: 1800 },
        { number: '204', status: 'available', price: 1800 }
    ],
    third: [
        { number: '301', status: 'available', price: 2000 },
        { number: '302', status: 'available', price: 2000 },
        { number: '303', status: 'available', price: 2500 }
    ]
};

const foodItems = [
    { id: 1, name: 'Breakfast', price: 150 },
    { id: 2, name: 'Lunch', price: 250 },
    { id: 3, name: 'Dinner', price: 300 },
    { id: 4, name: 'Snacks', price: 100 },
    { id: 5, name: 'Tea/Coffee', price: 50 },
    { id: 6, name: 'Cold Drinks', price: 60 }
];

const API_BASE_URL = "http://localhost:3001/api";

let bookings = [];
let customers = [];
let payments = [];
let invoices = [];
let selectedRoom = null;
let foodOrder = {};
let bookingCounter = 1;
let currentTheme = 'light';
let autoSaveInterval = null;

// Initialize on page load
window.onload = function() {
    loadTheme();
    loadData();
    initializeRooms();
    initializeFoodMenu();
    updateDashboard();
    updateAllTables();
    startAutoSave();
    initializeMobileMenu();
    fetchBookings();
};

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bookingForm");

  if (form) {
    form.addEventListener("submit", handleBookingSubmit);
    console.log("✅ Booking form connected");
  } else {
    console.error("❌ bookingForm not found");
  }
});

async function handleBookingSubmit(event) {
   
    event.preventDefault();
     alert('it runned')

    const roomAmount = Number(document.getElementById("roomAmount").value);
    const additionalAmount =
        Number(document.getElementById("additionalAmount").value) || 0;
    const advance = Number(document.getElementById("advancePayment").value);
    const totalAmount = roomAmount + additionalAmount;

    const booking = {
        customerName: document.getElementById("cust1").value,
        mobile: document.getElementById("mobile1").value,
        address: document.getElementById("address").value,
        numPersons: document.getElementById("numPersons").value,
        selectedRoom :"First floor AC", // predefined
        checkIn: document.getElementById("checkInDate").value,
        checkInTime: document.getElementById("checkInTime").value,
        checkOut: document.getElementById("checkOutDate").value,
        note: document.getElementById("note").value,
        roomAmount,
        additionalAmount,
        totalAmount,
        paymentMode: document.getElementById("paymentMode").value,
        advance,
        balance: totalAmount - advance,
        status: "Confirmed"
    };

    console.log("Booking payload:", booking);

    try {
        const res = await fetch("http://localhost:3001/api/bookings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(booking)
        });

        if (!res.ok) {
            throw new Error("Failed to save booking");
        }

        const savedBooking = await res.json();
        console.log("Saved to database:", savedBooking);

        bookings.push(savedBooking);
        alert('hogya')

        updateDashboard();
        updateAllTables();

        document.getElementById("bookingForm").reset();

        alert("✅ Booking saved in database.\n📊 Excel can be downloaded anytime.");

    } catch (error) {
        console.error(error);
        alert("❌ Error saving booking");
    }
}


async function fetchBookings() {
  try {
    const res = await fetch(`${API_BASE_URL}/bookings`);
    const data = await res.json();

    bookings = data;
    updateDashboard();
    updateAllTables();

  } catch (error) {
    console.error("Error fetching bookings:", error);
  }
}

console.log('bookings',bookings)

// Mobile Menu Functions
function initializeMobileMenu() {
    // Create mobile menu toggle button if it doesn't exist
    if (!document.querySelector('.menu-toggle')) {
        const menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.innerHTML = '☰';
        menuToggle.onclick = toggleMobileMenu;
        document.body.appendChild(menuToggle);
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        const sidebar = document.querySelector('.sidebar');
        const menuToggle = document.querySelector('.menu-toggle');
        
        if (sidebar && menuToggle && 
            !sidebar.contains(event.target) && 
            !menuToggle.contains(event.target) &&
            sidebar.classList.contains('mobile-open')) {
            sidebar.classList.remove('mobile-open');
        }
    });
    
    // Close menu when clicking a menu item on mobile
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                document.querySelector('.sidebar').classList.remove('mobile-open');
            }
        });
    });
}

function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('mobile-open');
}

// Theme Functions
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    
    if (currentTheme === 'light') {
        body.classList.add('dark-theme');
        themeIcon.textContent = '☀️';
        currentTheme = 'dark';
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark-theme');
        themeIcon.textContent = '🌙';
        currentTheme = 'light';
        localStorage.setItem('theme', 'light');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        document.getElementById('themeIcon').textContent = '☀️';
        currentTheme = 'dark';
    }
}

// Data Management
function loadData() {
    try {
        const savedBookings = localStorage.getItem('hotelBookings');
        const savedCustomers = localStorage.getItem('hotelCustomers');
        const savedPayments = localStorage.getItem('hotelPayments');
        const savedInvoices = localStorage.getItem('hotelInvoices');
        const savedRooms = localStorage.getItem('hotelRooms');
        const savedCounter = localStorage.getItem('bookingCounter');

        if (savedBookings) bookings = JSON.parse(savedBookings);
        if (savedCustomers) customers = JSON.parse(savedCustomers);
        if (savedPayments) payments = JSON.parse(savedPayments);
        if (savedInvoices) invoices = JSON.parse(savedInvoices);
        if (savedCounter) bookingCounter = parseInt(savedCounter);
        if (savedRooms) {
            const loadedRooms = JSON.parse(savedRooms);
            Object.assign(rooms, loadedRooms);
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function saveData() {
    try {
        localStorage.setItem('hotelBookings', JSON.stringify(bookings));
        localStorage.setItem('hotelCustomers', JSON.stringify(customers));
        localStorage.setItem('hotelPayments', JSON.stringify(payments));
        localStorage.setItem('hotelInvoices', JSON.stringify(invoices));
        localStorage.setItem('hotelRooms', JSON.stringify(rooms));
        localStorage.setItem('bookingCounter', bookingCounter.toString());
        updateAutoSaveStatus('saved');
        console.log('Data saved successfully');
    } catch (error) {
        console.error('Error saving data:', error);
        updateAutoSaveStatus('error');
    }
}

function updateAutoSaveStatus(status) {
    const statusEl = document.getElementById('autoSaveStatus');
    if (status === 'saved') {
        statusEl.textContent = '✓ Data saved';
        statusEl.style.background = '#d4edda';
        statusEl.style.color = '#155724';
    } else if (status === 'saving') {
        statusEl.textContent = '⏳ Saving...';
        statusEl.style.background = '#fff3cd';
        statusEl.style.color = '#856404';
    } else if (status === 'error') {
        statusEl.textContent = '❌ Save error';
        statusEl.style.background = '#f8d7da';
        statusEl.style.color = '#721c24';
    }
}

// Auto-save every 2 minutes and export to Excel
function startAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    autoSaveInterval = setInterval(() => {
        saveData();
        if (bookings.length > 0) {
            exportAllToExcel(true);
        }
    }, 120000); // 2 minutes
}

// Navigation
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update menu active state
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => item.classList.remove('active'));
    event.target.classList.add('active');
}

// Logout Function
function logout() {
    if (confirm('Are you sure you want to logout? Data will be exported to Excel first.')) {
        if (bookings.length > 0) {
            exportAllToExcel(false);
        }
        localStorage.clear();
        alert('Logged out successfully! Data has been exported.');
        location.reload();
    }
}

// Room Management
function initializeRooms() {
    renderRoomBoxes('firstFloor', rooms.first);
    renderRoomBoxes('secondFloor', rooms.second);
    renderRoomBoxes('thirdFloor', rooms.third);
    renderRoomStatus();
}

function renderRoomBoxes(containerId, roomList) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    roomList.forEach(room => {
        const box = document.createElement('div');
        box.className = `room-box ${room.status}`;
        box.innerHTML = `${room.number}<br><small>₹${room.price}</small>`;
        
        if (room.status === 'available') {
            box.onclick = function() {
                selectRoom(room, box);
            };
        }
        
        container.appendChild(box);
    });
}

function selectRoom(room, boxElement) {
    // Remove selected class from all boxes
    const allBoxes = document.querySelectorAll('.room-box');
    allBoxes.forEach(box => box.classList.remove('selected'));
    
    // Add selected class to clicked box
    boxElement.classList.add('selected');
    selectedRoom = room;
    document.getElementById('roomAmount').value = room.price;
    console.log('Room selected:', room.number);
}

function renderRoomStatus() {
    const container = document.getElementById('roomsStatus');
    if (!container) return;
    
    let html = '';
    const floors = [
        { name: 'First Floor', rooms: rooms.first },
        { name: 'Second Floor', rooms: rooms.second },
        { name: 'Third Floor', rooms: rooms.third }
    ];

    floors.forEach(floor => {
        html += `<div class="floor-section">
            <div class="floor-title">${floor.name}</div>
            <div class="room-selector">`;
        floor.rooms.forEach(room => {
            html += `<div class="room-box ${room.status}">
                ${room.number}<br>
                <small>₹${room.price}</small><br>
                <small style="text-transform: capitalize;">${room.status}</small>
            </div>`;
        });
        html += `</div></div>`;
    });
    container.innerHTML = html;
}

// Food Menu
function initializeFoodMenu() {
    const menu = document.getElementById('foodMenu');
    if (!menu) return;
    
    menu.innerHTML = '';
    foodItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'food-item';
        div.innerHTML = `
            <h4>${item.name}</h4>
            <div class="price">₹${item.price}</div>
            <div class="quantity-control">
                <button type="button" class="quantity-btn" onclick="updateFoodQty(${item.id}, -1)">-</button>
                <span class="quantity-display" id="qty-${item.id}">0</span>
                <button type="button" class="quantity-btn" onclick="updateFoodQty(${item.id}, 1)">+</button>
            </div>
        `;
        menu.appendChild(div);
    });
}

function updateFoodQty(itemId, change) {
    if (!foodOrder[itemId]) foodOrder[itemId] = 0;
    foodOrder[itemId] = Math.max(0, foodOrder[itemId] + change);
    document.getElementById(`qty-${itemId}`).textContent = foodOrder[itemId];
    updateFoodTotal();
}

function updateFoodTotal() {
    let total = 0;
    for (let itemId in foodOrder) {
        const item = foodItems.find(i => i.id == itemId);
        total += item.price * foodOrder[itemId];
    }
    document.getElementById('foodTotal').textContent = total;
}

function createFoodOrder() {
    let hasItems = false;
    for (let id in foodOrder) {
        if (foodOrder[id] > 0) hasItems = true;
    }
    if (!hasItems) {
        alert('Please select at least one food item');
        return;
    }
    alert('Food order created successfully!');
    foodOrder = {};
    initializeFoodMenu();
    updateFoodTotal();
}

// Booking Management



function generateInvoice(booking) {
    const invoice = {
        id: 'INV' + String(invoices.length + 1).padStart(4, '0'),
        booking: booking,
        date: booking.date,
        time: booking.time
    };
    invoices.push(invoice);
    renderInvoices();
}

function renderInvoices() {
    const invoicesList = document.getElementById('invoicesList');
    if (!invoicesList) return;
    
    if (invoices.length === 0) {
        invoicesList.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No invoices yet</p>';
        return;
    }

    invoicesList.innerHTML = '';
    const sortedInvoices = [...invoices].reverse();
    
    sortedInvoices.forEach((invoice, index) => {
        const booking = invoice.booking;
        const invoiceHTML = `
            <div class="invoice-section" style="margin-bottom: 30px;">
                <div class="invoice-header">
                    <h2>🏨 SAI GANGA HOTEL</h2>
                    <p><strong>Invoice #${invoice.id}</strong></p>
                    <p>${invoice.date} - ${invoice.time}</p>
                </div>
                <div class="invoice-details">
                    <div>
                        <strong>Customer Name:</strong> ${booking.customerName}<br>
                        <strong>Mobile:</strong> ${booking.mobile}<br>
                        <strong>Address:</strong> ${booking.address || 'N/A'}<br>
                        <strong>Booking ID:</strong> ${booking.id}
                    </div>
                    <div>
                        <strong>Room Number:</strong> ${booking.room}<br>
                        <strong>Check-in:</strong> ${booking.checkIn}<br>
                        <strong>Check-out:</strong> ${booking.checkOut || 'Not set'}<br>
                        <strong>Payment Mode:</strong> ${booking.paymentMode}
                    </div>
                </div>
                <table class="invoice-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th style="text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Room Charges</td>
                            <td style="text-align: right;">₹${booking.roomAmount}</td>
                        </tr>
                        ${booking.additionalAmount > 0 ? `<tr>
                            <td>Additional Charges</td>
                            <td style="text-align: right;">₹${booking.additionalAmount}</td>
                        </tr>` : ''}
                        <tr>
                            <td>Advance Payment</td>
                            <td style="text-align: right;">-₹${booking.advance}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="invoice-total">
                    Total Amount: ₹${booking.totalAmount}<br>
                    Paid: ₹${booking.advance}<br>
                    Balance: ₹${booking.balance}
                </div>
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button class="print-btn" onclick="window.print()">🖨️ Print</button>
                    <button class="btn btn-whatsapp" onclick='shareInvoiceByIndex(${invoices.length - 1 - index})'>
                        📱 WhatsApp
                    </button>
                </div>
            </div>
        `;
        invoicesList.innerHTML += invoiceHTML;
    });
}

function shareInvoiceByIndex(index) {
    const invoice = invoices[index];
    if (invoice) {
        shareInvoiceWhatsApp(invoice.booking);
    }
}

function shareInvoiceWhatsApp(booking) {
    const invoiceData = invoices.find(inv => inv.booking.id === booking.id);
    const message = `*SAI GANGA HOTEL - BOOKING CONFIRMATION*

*Invoice No:* ${invoiceData?.id || 'N/A'}
*Booking ID:* ${booking.id}

*Customer Details:*
Name: ${booking.customerName}
Mobile: ${booking.mobile}
Address: ${booking.address || 'N/A'}

*Booking Details:*
Room Number: ${booking.room}
Check-in Date: ${booking.checkIn}
Check-in Time: ${booking.checkInTime || 'N/A'}
Check-out Date: ${booking.checkOut || 'Not set'}
No. of Persons: ${booking.numPersons}

*Payment Details:*
Room Charges: ₹${booking.roomAmount}
${booking.additionalAmount > 0 ? `Additional Charges: ₹${booking.additionalAmount}\n` : ''}Total Amount: ₹${booking.totalAmount}
Advance Paid: ₹${booking.advance}
Balance Due: ₹${booking.balance}
Payment Mode: ${booking.paymentMode}

Thank you for choosing Sai Ganga Hotel!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${booking.mobile}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
}

// Dashboard Updates
function updateDashboard() {
    document.getElementById('bookingCount').textContent = bookings.length;
    
    let availableCount = 0;
    for (let floor in rooms) {
        availableCount += rooms[floor].filter(r => r.status === 'available').length;
    }
    document.getElementById('availableCount').textContent = availableCount;
    
    const today = new Date().toLocaleDateString();
    let todayRevenue = bookings
        .filter(b => b.date === today)
        .reduce((sum, b) => sum + b.totalAmount, 0);
    document.getElementById('revenueToday').textContent = '₹' + todayRevenue;
    
    let pendingAmount = bookings.reduce((sum, b) => sum + b.balance, 0);
    document.getElementById('pendingAmount').textContent = '₹' + pendingAmount;

    // Update recent bookings
    const recentTable = document.getElementById('recentBookingsTable');
    if (bookings.length > 0) {
        const recentBookings = bookings.slice(-5).reverse();
        recentTable.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Booking ID</th>
                        <th>Customer</th>
                        <th>Room</th>
                        <th>Check-in</th>
                        <th>Amount</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentBookings.map(b => `
                        <tr>
                            <td>${b.id}</td>
                            <td>${b.customerName}</td>
                            <td>${b.room}</td>
                            <td>${b.checkIn}</td>
                            <td>₹${b.totalAmount}</td>
                            <td><span class="badge badge-success">${b.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
}

function updateAllTables() {
    // Update all bookings table
    const allBookingsTable = document.getElementById('allBookingsTable');
    if (allBookingsTable) {
        if (bookings.length > 0) {
            allBookingsTable.innerHTML = bookings.map((b, index) => `
                <tr>
                    <td>${b.id}</td>
                    <td>${b.customerName}</td>
                    <td>${b.mobile}</td>
                    <td>${b.room}</td>
                    <td>${b.checkIn}</td>
                    <td>₹${b.totalAmount}</td>
                    <td><span class="badge badge-success">${b.status}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn btn-primary" onclick="shareBookingByIndex(${index})">
                                WhatsApp
                            </button>
                            <button class="action-btn btn-danger" onclick="checkoutBooking('${b.id}')">Checkout</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            allBookingsTable.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #7f8c8d;">No bookings yet</td></tr>';
        }
    }

    // Update customers table
    const customersTable = document.getElementById('customersTable');
    if (customersTable) {
        if (customers.length > 0) {
            customersTable.innerHTML = customers.map(c => `
                <tr>
                    <td>${c.id}</td>
                    <td>${c.name}</td>
                    <td>${c.mobile}</td>
                    <td>${c.address}</td>
                    <td>${c.totalBookings}</td>
                </tr>
            `).join('');
        } else {
            customersTable.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #7f8c8d;">No customers yet</td></tr>';
        }
    }

    // Update payments table
    const paymentsTable = document.getElementById('paymentsTable');
    if (paymentsTable) {
        if (payments.length > 0) {
            paymentsTable.innerHTML = payments.map(p => `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.bookingId}</td>
                    <td>${p.customerName}</td>
                    <td>₹${p.amount}</td>
                    <td>${p.paymentMode}</td>
                    <td>${p.date} ${p.time}</td>
                </tr>
            `).join('');
        } else {
            paymentsTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #7f8c8d;">No payments yet</td></tr>';
        }
    }

    renderInvoices();
}

function shareBookingByIndex(index) {
    const booking = bookings[index];
    if (booking) {
        shareInvoiceWhatsApp(booking);
    }
}

function checkoutBooking(bookingId) {
    if (!confirm('Are you sure you want to checkout this booking?')) return;

    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        // Mark room as available
        for (let floor in rooms) {
            const room = rooms[floor].find(r => r.number === booking.room);
            if (room) {
                room.status = 'available';
                break;
            }
        }

        booking.status = 'Checked Out';
        saveData();
        initializeRooms();
        updateDashboard();
        updateAllTables();
        alert('✅ Checkout completed successfully!');
    }
}

// Excel Functions
function exportAllToExcel(isAuto = false) {
    if (!isAuto) updateAutoSaveStatus('saving');
    
    const wb = XLSX.utils.book_new();

    // Bookings sheet
    const bookingsData = bookings.map(b => ({
        'Booking ID': b.id,
        'Customer Name': b.customerName,
        'Mobile': b.mobile,
        'Address': b.address,
        'State': b.state,
        'Room': b.room,
        'Check-in': b.checkIn,
        'Check-out': b.checkOut,
        'Total Amount': b.totalAmount,
        'Advance': b.advance,
        'Balance': b.balance,
        'Payment Mode': b.paymentMode,
        'Status': b.status,
        'Date': b.date
    }));
    const wsBookings = XLSX.utils.json_to_sheet(bookingsData);
    XLSX.utils.book_append_sheet(wb, wsBookings, 'Bookings');

    // Customers sheet
    const customersData = customers.map(c => ({
        'Customer ID': c.id,
        'Name': c.name,
        'Mobile': c.mobile,
        'Address': c.address,
        'Total Bookings': c.totalBookings
    }));
    const wsCustomers = XLSX.utils.json_to_sheet(customersData);
    XLSX.utils.book_append_sheet(wb, wsCustomers, 'Customers');

    // Payments sheet
    const paymentsData = payments.map(p => ({
        'Payment ID': p.id,
        'Booking ID': p.bookingId,
        'Customer Name': p.customerName,
        'Amount': p.amount,
        'Payment Mode': p.paymentMode,
        'Date': p.date,
        'Time': p.time
    }));
    const wsPayments = XLSX.utils.json_to_sheet(paymentsData);
    XLSX.utils.book_append_sheet(wb, wsPayments, 'Payments');

    // Rooms sheet
    const roomsData = [];
    for (let floor in rooms) {
        rooms[floor].forEach(r => {
            roomsData.push({
                'Room Number': r.number,
                'Status': r.status,
                'Price': r.price
            });
        });
    }
    const wsRooms = XLSX.utils.json_to_sheet(roomsData);
    XLSX.utils.book_append_sheet(wb, wsRooms, 'Rooms');

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `SaiGanga_Hotel_${timestamp}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    if (!isAuto) {
        alert('✅ Data exported successfully to Excel!');
        updateAutoSaveStatus('saved');
    }
}

function exportBookingsToExcel() {
    const data = bookings.map(b => ({
        'Booking ID': b.id,
        'Customer Name': b.customerName,
        'Mobile': b.mobile,
        'Room': b.room,
        'Check-in': b.checkIn,
        'Total Amount': b.totalAmount,
        'Advance': b.advance,
        'Balance': b.balance,
        'Status': b.status
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
    XLSX.writeFile(wb, `Bookings_${new Date().toISOString().split('T')[0]}.xlsx`);
    alert('✅ Bookings exported successfully!');
}

function exportCustomersToExcel() {
    const data = customers.map(c => ({
        'Customer ID': c.id,
        'Name': c.name,
        'Mobile': c.mobile,
        'Address': c.address,
        'Total Bookings': c.totalBookings
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, `Customers_${new Date().toISOString().split('T')[0]}.xlsx`);
    alert('✅ Customers exported successfully!');
}

function exportPaymentsToExcel() {
    const data = payments.map(p => ({
        'Payment ID': p.id,
        'Booking ID': p.bookingId,
        'Customer Name': p.customerName,
        'Amount': p.amount,
        'Payment Mode': p.paymentMode,
        'Date': p.date
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payments');
    XLSX.writeFile(wb, `Payments_${new Date().toISOString().split('T')[0]}.xlsx`);
    alert('✅ Payments exported successfully!');
}

function importFromExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Import Bookings
            if (workbook.SheetNames.includes('Bookings')) {
                const bookingsSheet = workbook.Sheets['Bookings'];
                const importedBookings = XLSX.utils.sheet_to_json(bookingsSheet);
                
                importedBookings.forEach(b => {
                    const booking = {
                        id: b['Booking ID'],
                        customerName: b['Customer Name'],
                        mobile: b['Mobile'],
                        address: b['Address'] || '',
                        state: b['State'] || '',
                        numPersons: b['No. of Persons'] || 1,
                        room: b['Room'],
                        checkIn: b['Check-in'],
                        checkInTime: b['Check-in Time'] || '',
                        checkOut: b['Check-out'] || '',
                        note: b['Note'] || '',
                        roomAmount: b['Room Amount'] || 0,
                        additionalAmount: b['Additional Amount'] || 0,
                        totalAmount: b['Total Amount'],
                        paymentMode: b['Payment Mode'],
                        advance: b['Advance'],
                        balance: b['Balance'],
                        status: b['Status'],
                        date: b['Date'],
                        time: b['Time'] || ''
                    };
                    bookings.push(booking);
                });
            }

            // Import Customers
            if (workbook.SheetNames.includes('Customers')) {
                const customersSheet = workbook.Sheets['Customers'];
                const importedCustomers = XLSX.utils.sheet_to_json(customersSheet);
                
                importedCustomers.forEach(c => {
                    customers.push({
                        id: c['Customer ID'],
                        name: c['Name'],
                        mobile: c['Mobile'],
                        address: c['Address'] || '',
                        totalBookings: c['Total Bookings'] || 0
                    });
                });
            }

            // Import Payments
            if (workbook.SheetNames.includes('Payments')) {
                const paymentsSheet = workbook.Sheets['Payments'];
                const importedPayments = XLSX.utils.sheet_to_json(paymentsSheet);
                
                importedPayments.forEach(p => {
                    payments.push({
                        id: p['Payment ID'],
                        bookingId: p['Booking ID'],
                        customerName: p['Customer Name'],
                        amount: p['Amount'],
                        paymentMode: p['Payment Mode'],
                        date: p['Date'],
                        time: p['Time'] || ''
                    });
                });
            }

            // Import Rooms
            if (workbook.SheetNames.includes('Rooms')) {
                const roomsSheet = workbook.Sheets['Rooms'];
                const importedRooms = XLSX.utils.sheet_to_json(roomsSheet);
                
                importedRooms.forEach(r => {
                    const roomNumber = r['Room Number'];
                    const floor = roomNumber.startsWith('1') ? 'first' : 
                                  roomNumber.startsWith('2') ? 'second' : 'third';
                    
                    const room = rooms[floor].find(rm => rm.number === roomNumber);
                    if (room) {
                        room.status = r['Status'];
                        room.price = r['Price'];
                    }
                });
            }

            // Update booking counter
            if (bookings.length > 0) {
                const maxId = Math.max(...bookings.map(b => parseInt(b.id.replace('BK', ''))));
                bookingCounter = maxId + 1;
            }

            // Generate invoices for imported bookings
            bookings.forEach(booking => {
                if (!invoices.find(inv => inv.booking.id === booking.id)) {
                    generateInvoice(booking);
                }
            });

            saveData();
            initializeRooms();
            updateDashboard();
            updateAllTables();

            alert('✅ Data imported successfully!');
            document.getElementById('importFile').value = '';
        } catch (error) {
            console.error('Error importing data:', error);
            alert('❌ Error importing data. Please check the Excel file format.');
        }
    };
    
    reader.readAsArrayBuffer(file);
}