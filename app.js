// APP.JS - COMMIT 4
const { createApp } = Vue;

createApp({
    data() {
        return {
            lessons: [
                { id: 1,  subject: 'Mathematics',         location: 'Al Barsha',            price: 100, spaces: 5 },
                { id: 2,  subject: 'English',             location: 'Al Danah',             price: 80,  spaces: 5 },
                { id: 3,  subject: 'Science',             location: 'Burjman',              price: 90,  spaces: 5 },
                { id: 4,  subject: 'History',             location: 'Deira',                price: 95,  spaces: 5 },
                { id: 5,  subject: 'Geography',           location: 'Dubai Internet City',  price: 85,  spaces: 5 },
                { id: 6,  subject: 'Art',                 location: 'Sports City',          price: 75,  spaces: 5 },
                { id: 7,  subject: 'Music',               location: 'Motor City',           price: 110, spaces: 5 },
                { id: 8,  subject: 'Physical Education',  location: 'International City',   price: 70,  spaces: 5 },
                { id: 9,  subject: 'Computer Science',    location: 'Al Nadaha',            price: 120, spaces: 5 },
                { id: 10, subject: 'Chemistry',           location: 'Business Bay',         price: 105, spaces: 5 }
            ],
            cart: [],
            showCart: false,
            searchQuery: '',
            sortBy: 'subject',      // NEW
            sortOrder: 'asc'        // NEW
        };
    },

    computed: {
        // NEW: Sort lessons
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

        // MODIFIED: Filter from sorted lessons
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
        // NEW: Toggle sort order
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

        removeFromCart(lessonId) {
            const cartItem = this.cart.find(item => item.id === lessonId);
            if (cartItem) {
                const lesson = this.lessons.find(l => l.id === lessonId);
                lesson.spaces += cartItem.quantity;
                this.cart = this.cart.filter(item => item.id !== lessonId);
            }
        }
    }
}).mount('#app');