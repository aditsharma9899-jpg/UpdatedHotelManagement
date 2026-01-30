/*p.get('/api/rooms', (req, res) => {
    res.json(rooms);
});

app.get('/api/bookings', (req, res) => {
    res.json(bookings);
});

app.post('/api/bookings', async (req, res) => {
    try {
        const booking = req.body;
        
        const nights = parseInt(booking.Nights) || 1;
        const roomPricePerNight = parseInt(booking['Room Price Per Night']) || 0;
        const roomAmount = roomPricePerNight * nights;
        const additionalAmount = parseInt(booking['Additional Amount']) || 0;
        const totalAmount = roomAmount + additionalAmount;
        const advance = parseInt(booking.Advance) || 0;
        const balance = totalAmount - advance;
        
        booking['Room Amount'] = roomAmount;
        booking['Total Amount'] = totalAmount;
        booking['Balance'] = balance;
        
        bookings.push(booking);
        
        if (booking['Room Number'] && !booking['Room Number'].includes('TBD')) {
            const roomNumbers = booking['Room Number'].split(', ');
            roomNumbers.forEach(roomNum => {
                const room = rooms.find(r => r['Room Number'] === roomNum.trim());
                if (room) room.Status = 'occupied';
            });
        }
        
        await saveData();
        
        res.json({ success: true, booking });
    } catch (error) {
        console.error('❌ Error creating booking:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

app.put('/api/bookings/:id', async (req, res) => {
    try {
        const bookingId = req.params.id;
        const updatedBooking = req.body;
        const index = bookings.findIndex(b => b['Booking ID'] === bookingId);
        
        if (index !== -1) {
            const oldBooking = bookings[index];
            
            const nights = parseInt(updatedBooking.Nights) || 1;
            const roomPricePerNight = parseInt(updatedBooking['Room Price Per Night']) || 0;
            const roomAmount = roomPricePerNight * nights;
            const additionalAmount = parseInt(updatedBooking['Additional Amount']) || 0;
            const totalAmount = roomAmount + additionalAmount;
            const advance = parseInt(updatedBooking.Advance) || 0;
            const balance = totalAmount - advance;
            
            updatedBooking['Room Amount'] = roomAmount;
            updatedBooking['Total Amount'] = totalAmount;
            updatedBooking['Balance'] = balance;
            
            if (oldBooking['Room Number'] !== updatedBooking['Room Number']) {
                if (oldBooking['Room Number'] && !oldBooking['Room Number'].includes('TBD')) {
                    const oldRoomNumbers = oldBooking['Room Number'].split(', ');
                    oldRoomNumbers.forEach(roomNum => {
                        const room = rooms.find(r => r['Room Number'] === roomNum.trim());
                        if (room) room.Status = 'available';
                    });
                }
                
                if (updatedBooking['Room Number'] && !updatedBooking['Room Number'].includes('TBD')) {
                    const newRoomNumbers = updatedBooking['Room Number'].split(', ');
                    newRoomNumbers.forEach(roomNum => {
                        const room = rooms.find(r => r['Room Number'] === roomNum.trim());
                        if (room) room.Status = 'occupied';
                    });
                }
            }
            
            bookings[index] = updatedBooking;
            await saveData();
            
            res.json({ success: true, booking: updatedBooking });
        } else {
            res.status(404).json({ error: 'Booking not found' });
        }
    } catch (error) {
        console.error('❌ Error updating booking:', error);
        res.status(500).json({ error: 'Failed to update booking' });
    }
});*/

// ✅ NEW: ALLOCATE ROOM TO ADVANCE BOOKING

/*
app.delete('/api/bookings/:id', async (req, res) => {
    try {
        const bookingId = req.params.id;
        const index = bookings.findIndex(b => b['Booking ID'] === bookingId);
        
        if (index !== -1) {
            const booking = bookings[index];
            
            if (booking['Room Number'] && !booking['Room Number'].includes('TBD')) {
                const roomNumbers = booking['Room Number'].split(', ');
                roomNumbers.forEach(roomNum => {
                    const room = rooms.find(r => r['Room Number'] === roomNum.trim());
                    if (room) room.Status = 'available';
                });
            }
            
            bookings.splice(index, 1);
            await saveData();
            
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Booking not found' });
        }
    } catch (error) {
        console.error('❌ Error deleting booking:', error);
        res.status(500).json({ error: 'Failed to delete booking' });
    }
});*/


/*
app.post('/api/bookings/:id/add-food', async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { foodItems, foodTotal } = req.body;
        const booking = bookings.find(b => b['Booking ID'] === bookingId);
        
        if (booking) {
            if (!booking['Food Orders']) booking['Food Orders'] = [];
            booking['Food Orders'].push(...foodItems);
            
            booking['Additional Amount'] = (booking['Additional Amount'] || 0) + foodTotal;
            booking['Total Amount'] = (booking['Total Amount'] || 0) + foodTotal;
            booking['Balance'] = (booking['Balance'] || 0) + foodTotal;
            
            await saveData();
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Booking not found' });
        }
    } catch (error) {
        console.error('❌ Error adding food:', error);
        res.status(500).json({ error: 'Failed to add food' });
    }
});

app.get('/api/customers', (req, res) => {
    res.json(customers);
});

app.post('/api/customers', async (req, res) => {
    try {
        customers.push(req.body);
        await saveData();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add customer' });
    }
});

app.delete('/api/customers/:id', async (req, res) => {
    try {
        const customerId = req.params.id;
        const index = customers.findIndex(c => c['Customer ID'] === customerId);
        
        if (index !== -1) {
            customers.splice(index, 1);
            await saveData();
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Customer not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

app.get('/api/payments', (req, res) => {
    res.json(payments);
});

app.post('/api/payments', async (req, res) => {
    try {
        const payment = req.body;
        payments.push(payment);
        
        const booking = bookings.find(b => b['Booking ID'] === payment['Booking ID']);
        if (booking) {
            booking.Balance = (booking.Balance || 0) - payment.Amount;
        }
        
        await saveData();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add payment' });
    }
});

app.delete('/api/payments/:id', async (req, res) => {
    try {
        const paymentId = req.params.id;
        const index = payments.findIndex(p => p['Payment ID'] === paymentId);
        
        if (index !== -1) {
            payments.splice(index, 1);
            await saveData();
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Payment not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete payment' });
    }
});

app.get('/api/staff', (req, res) => {
    res.json(staff);
});

app.post('/api/staff', async (req, res) => {
    try {
        staff.push(req.body);
        await saveData();
        res.json({ success: true, staff: req.body });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add staff' });
    }
});

app.put('/api/staff/:id', async (req, res) => {
    try {
        const staffId = req.params.id;
        const index = staff.findIndex(s => s['Staff ID'] === staffId);
        
        if (index !== -1) {
            staff[index] = req.body;
            await saveData();
            res.json({ success: true, staff: req.body });
        } else {
            res.status(404).json({ error: 'Staff not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update staff' });
    }
});

app.delete('/api/staff/:id', async (req, res) => {
    try {
        const staffId = req.params.id;
        const index = staff.findIndex(s => s['Staff ID'] === staffId);
        
        if (index !== -1) {
            staff.splice(index, 1);
            await saveData();
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Staff not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete staff' });
    }
});

app.get('/api/attendance', (req, res) => {
    res.json(attendance);
});

app.post('/api/attendance', async (req, res) => {
    try {
        attendance.push(req.body);
        await saveData();
        res.json({ success: true, attendance: req.body });
    } catch (error) {
        res.status(500).json({ error: 'Failed to record attendance' });
    }
});*/