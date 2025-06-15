const BACKEND_URL = "http://localhost:5000"; // Change to Render URL in production
const stripePublicKey = "pk_test_51RZsGyQnckO6Q134MosfGqEbDUtkbdWVlFE7mwP4HhO6tPg1O71G1WUYpfjxmxsSw2EOb1wzTTU8uw7xYk47ZtEy004vgMC544";

document.addEventListener("DOMContentLoaded", () => {
    let cart = [];
    const cartCountSpan = document.getElementById("cart-count");
    const cartModal = document.getElementById("cart-modal");
    const cartItemsList = document.getElementById("cart-items");
    const cartTotalSpan = document.getElementById("cart-total");
    const buyNowBtn = document.getElementById("buy-now-btn");
    const showCartButton = document.getElementById("show-cart");

    function updateCartCount() {
        if (cartCountSpan) {
            cartCountSpan.innerText = `(${cart.reduce((sum, item) => sum + item.quantity, 0)})`;
        }
    }

    function showCart() {
        if (!cartItemsList || !cartTotalSpan || !cartModal) return;

        cartItemsList.innerHTML = "";
        let total = 0;

        if (cart.length === 0) {
            cartItemsList.innerHTML = "<li>Your cart is empty.</li>";
        } else {
            cart.forEach((item, index) => {
                const listItem = document.createElement("li");
                const itemTotal = item.price * item.quantity;
                total += itemTotal;

                listItem.innerHTML = `
                    <span>${item.title} × ${item.quantity} - ₹${itemTotal.toLocaleString("en-IN")}</span>
                    <button class="remove-item-btn" data-index="${index}">Remove</button>
                `;
                cartItemsList.appendChild(listItem);
            });
        }

        cartTotalSpan.innerText = total.toLocaleString("en-IN");
        cartModal.style.display = "block";

        // Add remove item listeners
        cartItemsList.querySelectorAll(".remove-item-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                cart.splice(parseInt(e.target.dataset.index), 1);
                updateCartCount();
                showCart();
            });
        });
    }

    // Add to cart functionality
    document.querySelectorAll(".masonry-item button").forEach((btn) => {
        btn.addEventListener("click", () => {
            const card = btn.closest(".masonry-item");
            const title = card.querySelector("h3").innerText.trim();
            const price = parseFloat(card.querySelector(".price").innerText.replace("₹", "").replace(/,/g, ""));
            const id = btn.dataset.productId;

            const existingItem = cart.find(item => item.id === id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ id, title, price, quantity: 1 });
            }

            updateCartCount();
            showCart();
        });
    });

    // Show cart button
    if (showCartButton) {
        showCartButton.addEventListener("click", (e) => {
            e.preventDefault();
            showCart();
        });
    }

    // Stripe payment logic
    if (buyNowBtn) {
        buyNowBtn.addEventListener("click", async () => {
            try {
                if (cart.length === 0) {
                    alert("Your cart is empty. Please add items before checking out.");
                    return;
                }

                const response = await fetch('http://localhost:5000/api/payment/create-checkout-session', {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        cartItems: cart.map(item => ({
                            title: item.title,
                            price: item.price,
                            quantity: item.quantity
                        }))
                    })
                });

                console.log('Response status:', response.status);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Payment initialization failed');
                }

                const data = await response.json();
                console.log('Session data:', data);

                const stripe = Stripe(stripePublicKey);
                const { error } = await stripe.redirectToCheckout({
                    sessionId: data.id
                });

                if (error) throw error;

            } catch (error) {
                console.error('Payment Error:', error);
                alert('Payment initialization failed. Check console for details.');
            }
        });
    }

    // Expose global closeCart function
    window.closeCart = function () {
        if (cartModal) {
            cartModal.style.display = "none";
        }
    };

    // Init cart count on load
    updateCartCount();
});
