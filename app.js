const { createApp } = Vue;

createApp({
    data() {
        return {
            // Lessons and cart data
            lessons: [],
            cart: [],
            showCart: false,
            
            // Sorting and filtering
            sortBy: 'subject',
            sortOrder: 'asc',
            searchQuery: '',
            searchTimeout: null,
            
            // UI states
            orderConfirmed: false,
            isLoading: true,

            // Order form data
            order: {
                firstName: '',
                lastName: '',
                address: '',
                state: '',
                zip: '',
                gift: false,
                method: 'Home'
            },

            // UAE states list
            states: [
                'Fujairah', 'Umm al Quwain', 'Ras al Khaimah',
                'Sharjah', 'Abu Dhabi', 'Ajman', 'Dubai'
            ],

            // Form validation
            errors: {},
            isFormValid: false,

            // Backend API URL
            apiUrl: 'https://cw1-backend-1-c9h3.onrender.com'
        };
    },

    computed: {
        // Sort lessons based on selected criteria and order
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

        // Filter lessons based on search query
        filteredLessons() {
            const q = this.searchQuery.toLowerCase().trim();
            if (!q) return this.sortedLessons;

            return this.sortedLessons.filter(l =>
                l.subject.toLowerCase().includes(q) ||
                l.location.toLowerCase().includes(q) ||
                String(l.price).includes(q) ||
                String(l.spaces).includes(q)
            );
        },

        // Calculate total cart price
        cartTotal() {
            return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        },

        // Calculate total items in cart
        cartItemCount() {
            return this.cart.reduce((sum, item) => sum + item.quantity, 0);
        }
    },

    methods: {
        // Fetch all lessons from backend
        async fetchLessons() {
            this.isLoading = true;
            try {
                const response = await fetch(`${this.apiUrl}/lessons`);
                const data = await response.json();
                this.lessons = data;
                console.log('✓ Lessons loaded. Sample image URL:', data[0]?.image);
            } catch (error) {
                console.error('Failed to fetch lessons:', error);
                alert("Cannot connect to server.");
            } finally {
                this.isLoading = false;
            }
        },

        // Search lessons with debounce
        async searchLessons() {
            if (this.searchTimeout) clearTimeout(this.searchTimeout);

            // If search is empty, reload all lessons
            if (!this.searchQuery.trim()) {
                await this.fetchLessons();
                return;
            }

            // Debounce search by 300ms
            this.searchTimeout = setTimeout(async () => {
                try {
                    const q = encodeURIComponent(this.searchQuery.trim());
                    const response = await fetch(`${this.apiUrl}/search?q=${q}`);
                    const data = await response.json();

                    if (data.length) {
                        this.lessons = data;
                    }
                } catch (error) {
                    console.error('Search error:', error);
                }
            }, 300);
        },

        // Update lesson available spaces in database
        async updateLessonSpaces(id, newSpaces) {
            try {
                const response = await fetch(`${this.apiUrl}/lessons/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ spaces: newSpaces })
                });

                const result = await response.json();
                return result.success;
            } catch (error) {
                alert("Failed to update lesson.");
                return false;
            }
        },

        // Handle image loading errors with placeholder fallback
        imgError(e) {
            e.target.src = `${this.apiUrl}/images/placeholder.png`;
        },

        // Toggle between ascending and descending sort order
        toggleSortOrder() {
            this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
        },

        // Add lesson to cart
        async addToCart(id) {
            const lesson = this.lessons.find(l => l.id === id);
            if (!lesson || lesson.spaces <= 0) return alert("Sold out!");

            const success = await this.updateLessonSpaces(id, lesson.spaces - 1);
            if (!success) return;

            lesson.spaces--;

            const existing = this.cart.find(i => i.id === id);
            existing ? existing.quantity++ : this.cart.push({ ...lesson, quantity: 1 });
        },

        // Remove all quantities of a lesson from cart
        async removeFromCart(id) {
            const item = this.cart.find(i => i.id === id);
            const lesson = this.lessons.find(l => l.id === id);
            if (!item || !lesson) return;

            const success = await this.updateLessonSpaces(id, lesson.spaces + item.quantity);
            if (!success) return;

            lesson.spaces += item.quantity;
            this.cart = this.cart.filter(c => c.id !== id);
        },

        // Decrease quantity of a lesson in cart
        async decreaseQuantity(id) {
            const item = this.cart.find(i => i.id === id);
            const lesson = this.lessons.find(l => l.id === id);

            if (item.quantity > 1) {
                const success = await this.updateLessonSpaces(id, lesson.spaces + 1);
                if (!success) return;

                item.quantity--;
                lesson.spaces++;
            } else {
                this.removeFromCart(id);
            }
        },

        // Validate checkout form fields
        checkFormValidity() {
            this.errors = {};
            const required = ["firstName", "lastName", "address", "state", "zip"];

            // Check required fields
            required.forEach(f => {
                if (!this.order[f]) this.errors[f] = "Required";
            });

            // Validate first name - letters only
            if (this.order.firstName && !/^[a-zA-Z\s\-']+$/.test(this.order.firstName)) {
                this.errors.firstName = "Letters only, no numbers";
            }

            // Validate last name - letters only
            if (this.order.lastName && !/^[a-zA-Z\s\-']+$/.test(this.order.lastName)) {
                this.errors.lastName = "Letters only, no numbers";
            }

            // Validate address - must contain letters and be at least 5 characters
            if (this.order.address) {
                if (!/[a-zA-Z]/.test(this.order.address)) {
                    this.errors.address = "Address must contain letters";
                }
                if (this.order.address.length < 5) {
                    this.errors.address = "Address too short";
                }
            }

            // Validate ZIP code - 4 to 10 digits only
            if (this.order.zip && !/^\d{4,10}$/.test(this.order.zip)) {
                this.errors.zip = "Enter 4–10 digits";
            }

            this.isFormValid = Object.keys(this.errors).length === 0;
        },

        // Submit order to backend
        async submitOrder() {
            this.checkFormValidity();
            if (!this.isFormValid) return alert("Fix the form errors.");
            if (!this.cart.length) return alert("Cart is empty.");

            const orderData = {
                ...this.order,
                items: this.cart,
                total: this.cartTotal,
                date: new Date().toISOString()
            };

            try {
                const response = await fetch(`${this.apiUrl}/orders`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(orderData)
                });

                const result = await response.json();

                if (result.success) {
                    alert("✓ Order placed successfully!");

                    // Clear cart and reset form
                    this.cart = [];
                    this.orderConfirmed = true;

                    this.order = {
                        firstName: '',
                        lastName: '',
                        address: '',
                        state: '',
                        zip: '',
                        gift: false,
                        method: 'Home'
                    };

                    // Close cart after confirmation
                    setTimeout(() => {
                        this.showCart = false;
                        this.orderConfirmed = false;
                    }, 1500);
                }
            } catch (error) {
                alert("Order failed.");
            }
        }
    },

    // Initialize app when mounted
    mounted() {
        this.fetchLessons();
    }
}).mount("#app");