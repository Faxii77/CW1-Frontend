const { createApp } = Vue;

createApp({
    data() {
        return {
            lessons: [],
            cart: [],
            showCart: false,
            sortBy: 'subject',
            sortOrder: 'asc',
            searchQuery: '',
            orderConfirmed: false,
            isLoading: true,
            searchTimeout: null,

            order: {
                firstName: '',
                lastName: '',
                address: '',
                state: '',
                zip: '',
                gift: false,
                method: 'Home'
            },

            states: ['Fujairah', 'Umm al Quwain', 'Ras al Khaimah', 'Sharjah', 'Abu Dhabi', 'Ajman', 'Dubai'],
            errors: {},
            isFormValid: false,
            apiUrl: 'https://cw1-backend-1-c9h3.onrender.com'
        };
    },

    computed: {
        sortedLessons() {
            return [...this.lessons].sort((a, b) => {
                let A = a[this.sortBy], B = b[this.sortBy];
                if (typeof A === 'string') { 
                    A = A.toLowerCase(); 
                    B = B.toLowerCase(); 
                }
                if (A > B) return this.sortOrder === 'asc' ? 1 : -1;
                if (A < B) return this.sortOrder === 'asc' ? -1 : 1;
                return 0;
            });
        },

        filteredLessons() {
            if (!this.searchQuery.trim()) return this.sortedLessons;
            return this.sortedLessons;
        },

        cartTotal() {
            return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        },

        cartItemCount() {
            return this.cart.reduce((sum, item) => sum + item.quantity, 0);
        }
    },

    methods: {
        // LOAD LESSONS FROM SERVER
        async fetchLessons() {
            this.isLoading = true;
            try {
                const response = await fetch(`${this.apiUrl}/lessons`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                this.lessons = data;
                console.log('✓ Loaded lessons:', data.length);
                
            } catch (error) {
                console.error("Cannot load lessons from server:", error);
                alert("Cannot connect to server. Please make sure the server is running on port 3000.");
            } finally {
                this.isLoading = false;
            }
        },

        // REAL-TIME SEARCH WITH DEBOUNCING
        async searchLessons() {
            // Clear existing timeout
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }

            // If search is empty, reload all lessons
            if (!this.searchQuery.trim()) {
                this.fetchLessons();
                return;
            }

            // Debounce: wait 300ms after user stops typing
            this.searchTimeout = setTimeout(async () => {
                try {
                    const query = encodeURIComponent(this.searchQuery.trim());
                    const response = await fetch(`${this.apiUrl}/search?q=${query}`);
                    
                    if (!response.ok) {
                        throw new Error(`Search failed: ${response.status}`);
                    }
                    
                    const results = await response.json();
                    this.lessons = results;
                    console.log('✓ Search results:', results.length);
                    
                } catch (error) {
                    console.error("Search error:", error);
                    alert("Search failed. Please try again.");
                }
            }, 300);
        },

        // UPDATE LESSON SPACES IN DATABASE
        async updateLessonSpaces(id, newSpaces) {
            try {
                const response = await fetch(`${this.apiUrl}/lessons/${id}`, {
                    method: "PUT",
                    headers: { 
                        "Content-Type": "application/json" 
                    },
                    body: JSON.stringify({ spaces: newSpaces })
                });

                if (!response.ok) {
                    throw new Error(`Update failed: ${response.status}`);
                }

                const result = await response.json();
                console.log('✓ Updated lesson spaces:', result);
                return result.success;
                
            } catch (error) {
                console.error("Error updating lesson:", error);
                alert("Failed to update lesson. Please try again.");
                return false;
            }
        },

        // IMAGE ERROR HANDLER
        imgError(e) {
            e.target.src = "images/placeholder.png";
        },

        // TOGGLE SORT ORDER
        toggleSortOrder() {
            this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
        },

        // ADD LESSON TO CART
        async addToCart(id) {
            const lesson = this.lessons.find(l => l.id === id);
            
            if (!lesson) {
                console.error("Lesson not found:", id);
                return;
            }
            
            if (lesson.spaces === 0) {
                alert("Sorry, this lesson is sold out!");
                return;
            }

            // Update database first
            const success = await this.updateLessonSpaces(id, lesson.spaces - 1);
            
            if (!success) {
                alert("Failed to add to cart. Please try again.");
                return;
            }

            // local state
            lesson.spaces--;

            // Add to cart or increase quantity
            const existing = this.cart.find(item => item.id === id);
            if (existing) {
                existing.quantity++;
            } else {
                this.cart.push({ ...lesson, quantity: 1 });
            }

            console.log('✓ Added to cart:', lesson.subject);
        },

        // REMOVE ITEM FROM CART
        async removeFromCart(id) {
            const cartItem = this.cart.find(item => item.id === id);
            if (!cartItem) return;

            const lesson = this.lessons.find(l => l.id === id);
            if (!lesson) return;

            // Restore spaces in database
            const success = await this.updateLessonSpaces(id, lesson.spaces + cartItem.quantity);

            if (success) {
                lesson.spaces += cartItem.quantity;
                this.cart = this.cart.filter(item => item.id !== id);
                console.log('✓ Removed from cart:', lesson.subject);
            } else {
                alert("Failed to remove item. Please try again.");
            }
        },

        // DECREASE QUANTITY IN CART
        async decreaseQuantity(id) {
            const cartItem = this.cart.find(item => item.id === id);
            const lesson = this.lessons.find(l => l.id === id);

            if (!cartItem || !lesson) return;

            if (cartItem.quantity > 1) {
                const success = await this.updateLessonSpaces(id, lesson.spaces + 1);
                
                if (!success) {
                    alert("Failed to update quantity. Please try again.");
                    return;
                }
                
                cartItem.quantity--;
                lesson.spaces++;
                console.log('✓ Decreased quantity:', lesson.subject);
            } else {
                // Remove if quantity is 1
                this.removeFromCart(id);
            }
        },

        // FORM VALIDATION
        checkFormValidity() {
            const required = ["firstName", "lastName", "address", "state", "zip"];
            this.errors = {};

            // Check required fields
            required.forEach(field => {
                if (!this.order[field] || this.order[field].trim() === "") {
                    this.errors[field] = "This field is required";
                }
            });

            // Validate first name (letters and spaces only)
            if (this.order.firstName && !/^[A-Za-z\s]+$/.test(this.order.firstName)) {
                this.errors.firstName = "Only letters and spaces allowed";
            }

            // Validate last name (letters and spaces only)
            if (this.order.lastName && !/^[A-Za-z\s]+$/.test(this.order.lastName)) {
                this.errors.lastName = "Only letters and spaces allowed";
            }

            // Validate zip code (4-10 digits)
            if (this.order.zip && !/^\d{4,10}$/.test(this.order.zip)) {
                this.errors.zip = "Enter 4-10 digits";
            }

            // Form is valid if no errors
            this.isFormValid = Object.keys(this.errors).length === 0;
        },

        // SUBMIT ORDER
        async submitOrder() {
            // Validate form
            this.checkFormValidity();
            
            if (!this.isFormValid) {
                alert("Please fill all required fields correctly.");
                return;
            }

            if (this.cart.length === 0) {
                alert("Your cart is empty.");
                return;
            }

            // Prepare order data
            const orderData = {
                ...this.order,
                items: this.cart,
                total: this.cartTotal,
                date: new Date().toISOString()
            };

            try {
                const response = await fetch(`${this.apiUrl}/orders`, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json" 
                    },
                    body: JSON.stringify(orderData)
                });

                if (!response.ok) {
                    throw new Error(`Order failed: ${response.status}`);
                }

                const result = await response.json();
                
                if (result.success) {
                    alert(`✓ Order placed successfully!\n\nOrder ID: ${result.orderId}\nTotal: £${this.cartTotal}\n\nThank you for your order!`);
                    
                    // Clear cart and reset form
                    this.cart = [];
                    this.orderConfirmed = true;
                    
                    // Reset form
                    this.order = {
                        firstName: '',
                        lastName: '',
                        address: '',
                        state: '',
                        zip: '',
                        gift: false,
                        method: 'Home'
                    };
                    
                    // Go back to lessons page
                    setTimeout(() => {
                        this.showCart = false;
                        this.orderConfirmed = false;
                    }, 2000);
                    
                    console.log('✓ Order submitted:', result.orderId);
                } else {
                    throw new Error("Order failed");
                }
                
            } catch (error) {
                console.error("Order submission error:", error);
                alert("Failed to place order. Please try again.");
            }
        }
    },

    // LIFECYCLE: Load lessons when app starts
    mounted() {
        console.log(' App initialized');
        this.fetchLessons();
    }
}).mount("#app");