const { createApp } = Vue;

createApp({
    data() {
        return {
            lessons: [
                { id: 1,  subject: 'Mathematics',         location: 'Al Barsha',            price: 100, spaces: 5, icon: 'math.png' },
                { id: 2,  subject: 'English',             location: 'Al Danah',             price: 80,  spaces: 5, icon: 'english.png' },
                { id: 3,  subject: 'Science',             location: 'Burjman',              price: 90,  spaces: 5, icon: 'science.png' },
                { id: 4,  subject: 'History',             location: 'Deira',                price: 95,  spaces: 5, icon: 'history.png' },
                { id: 5,  subject: 'Geography',           location: 'Dubai Internet City',  price: 85,  spaces: 5, icon: 'geography.png' },
                { id: 6,  subject: 'Art',                 location: 'Sports City',          price: 75,  spaces: 5, icon: 'art.png' },
                { id: 7,  subject: 'Music',               location: 'Motor City',           price: 110, spaces: 5, icon: 'music.png' },
                { id: 8,  subject: 'Physical Education',  location: 'International City',   price: 70,  spaces: 5, icon: 'pe.png' },
                { id: 9,  subject: 'Computer Science',    location: 'Al Nadaha',            price: 120, spaces: 5, icon: 'cs.png' },
                { id: 10, subject: 'Chemistry',           location: 'Business Bay',         price: 105, spaces: 5, icon: 'chemistry.png' }
            ],
            cart: [],
            showCart: false,
            sortBy: 'subject',
            sortOrder: 'asc',
            searchQuery: '',
            orderConfirmed: false,
            order: {
                firstName: '',
                lastName: '',
                address: '',
                city: '',
                state: '',
                zip: '',
                gift: false,
                method: 'Home'
            },
            states: ['Fujairah', 'Umm al Quwain', 'Ras al Khaimah', 'Sharjah', 'Abu Dhabi', 'Ajman', 'Dubai'],
            errors: {},
            isFormValid: false
        };
    },

    computed: {
        sortedLessons() {
            return [...this.lessons].sort((a, b) => {
                let compareA = a[this.sortBy];
                let compareB = b[this.sortBy];
                if (typeof compareA === 'string') {
                    compareA = compareA.toLowerCase();
                    compareB = compareB.toLowerCase();
                }
                if (compareA > compareB) return this.sortOrder === 'asc' ? 1 : -1;
                if (compareA < compareB) return this.sortOrder === 'asc' ? -1 : 1;
                return 0;
            });
        },

        filteredLessons() {
            const query = this.searchQuery.trim().toLowerCase();
            if (!query) return this.sortedLessons;
            return this.sortedLessons.filter(lesson =>
                lesson.subject.toLowerCase().includes(query) ||
                lesson.location.toLowerCase().includes(query)
            );
        },

        cartTotal() {
            return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        },

        cartItemCount() {
            return this.cart.reduce((sum, item) => sum + item.quantity, 0);
        }
    },

    methods: {
        // Optional: use in <img @error="imgError"> to show a placeholder if an icon is missing
       imgError(e) {
  // Prevent blinking by checking if it's already using the fallback
  if (!e.target.src.includes('placeholder.png')) {
    e.target.src = 'images/placeholder.png';
  }
  e.target.onerror = null; // prevent infinite loop
}
,

        toggleView() {
            this.showCart = !this.showCart;
        },

        toggleSortOrder() {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        },

        addToCart(lessonId) {
            const lesson = this.lessons.find(l => l.id === lessonId);
            if (lesson && lesson.spaces > 0) {
                lesson.spaces--;
                const existingItem = this.cart.find(item => item.id === lessonId);
                if (existingItem) {
                    existingItem.quantity++;
                } else {
                    this.cart.push({ ...lesson, quantity: 1 });
                }
            }
        },

        decreaseQuantity(lessonId) {
            const cartItem = this.cart.find(item => item.id === lessonId);
            const lesson = this.lessons.find(l => l.id === lessonId);
            if (cartItem && cartItem.quantity > 1) {
                cartItem.quantity--;
                lesson.spaces++;
            } else if (cartItem && cartItem.quantity === 1) {
                this.removeFromCart(lessonId);
            }
        },

        removeFromCart(lessonId) {
            const cartItem = this.cart.find(item => item.id === lessonId);
            if (cartItem) {
                const lesson = this.lessons.find(l => l.id === lessonId);
                lesson.spaces += cartItem.quantity;
                this.cart = this.cart.filter(item => item.id !== lessonId);
            }
        },

        checkFormValidity() {
            const requiredFields = ['firstName', 'lastName', 'address', 'city', 'state', 'zip'];
            this.errors = {};

            requiredFields.forEach(field => {
                if (!this.order[field] || this.order[field].trim() === '') {
                    this.errors[field] = 'This field is required';
                }
            });

            if (this.order.firstName && !/^[A-Za-z\s]+$/.test(this.order.firstName)) {
                this.errors.firstName = 'Invalid first name';
            }

            if (this.order.lastName && !/^[A-Za-z\s]+$/.test(this.order.lastName)) {
                this.errors.lastName = 'Invalid last name';
            }

            if (this.order.zip && !/^[0-9]{4,10}$/.test(this.order.zip)) {
                this.errors.zip = 'Invalid zip code';
            }

            this.isFormValid = Object.keys(this.errors).length === 0;
        },

        submitOrder() {
            this.checkFormValidity();

            if (this.cart.length === 0) {
                alert("Your cart is empty.");
                return;
            }

            if (!this.isFormValid) {
                alert("Please fill out all required fields correctly.");
                return;
            }

            this.orderConfirmed = true;

            setTimeout(() => {
                this.cart = [];
                this.order = {
                    firstName: '',
                    lastName: '',
                    address: '',
                    city: '',
                    state: '',
                    zip: '',
                    gift: false,
                    method: 'Home'
                };
                this.orderConfirmed = false;
                this.showCart = false;
                this.isFormValid = false;
            }, 3000);
        }
    }
}).mount('#app');
