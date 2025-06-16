const BACKEND_URL = "http://localhost:5000"; // Change to Render URL in production
const stripePublicKey = "pk_test_51RZsGyQnckO6Q134MosfGqEbDUtkbdWVlFE7mwP4HhO6tPg1O71G1WUYpfjxmxsSw2EOb1wzTTU8uw7xYk47ZtEy004vgMC544";

document.addEventListener("DOMContentLoaded", () => {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    const userNameSpan = document.getElementById("user-name");
    const userInfo = document.getElementById("user-info");
    const user = JSON.parse(localStorage.getItem("user"));

    const loginBtn = document.querySelector(".login");
    const signupBtn = document.querySelector(".signup");
    const logoutBtn = document.getElementById("logout-button");

    if (user) {
        if (loginBtn) loginBtn.style.display = "none";
        if (signupBtn) signupBtn.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "block";
    } else {
        if (logoutBtn) logoutBtn.style.display = "none";
    }

    const cartCountSpan = document.getElementById("cart-count");
    const cartModal = document.getElementById("cart-modal");
    const cartItemsList = document.getElementById("cart-items");
    const cartTotalSpan = document.getElementById("cart-total");
    const buyNowBtn = document.getElementById("buy-now-btn");
    const showCartButton = document.getElementById("show-cart");

    if (userInfo && user) {
        userInfo.textContent = `Logged in as ${user.name}`;
    }

    if (user && userInfo && userNameSpan) {
        userNameSpan.textContent = user.name;
    }

    function updateCartCount() {
        if (cartCountSpan) {
            cartCountSpan.innerText = `(${cart.reduce((sum, item) => sum + item.quantity, 0)})`;
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            alert("You have been logged out.");
            window.location.href = "index.html";
        });
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

        cartItemsList.querySelectorAll(".remove-item-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                cart.splice(parseInt(e.target.dataset.index), 1);
                localStorage.setItem("cart", JSON.stringify(cart));
                updateCartCount();
                showCart();
            });
        });
    }

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

            localStorage.setItem("cart", JSON.stringify(cart));
            updateCartCount();
            showCart();
        });
    });

    if (showCartButton) {
        showCartButton.addEventListener("click", (e) => {
            e.preventDefault();
            showCart();
        });
    }

    if (buyNowBtn) {
        buyNowBtn.addEventListener("click", async () => {
            try {
                if (cart.length === 0) {
                    alert("Your cart is empty. Please add items before checking out.");
                    return;
                }

                if (!user) {
                    alert("Please log in to proceed with payment.");
                    window.location.href = "login.html";
                    return;
                }

                const response = await fetch(`${BACKEND_URL}/api/payment/create-checkout-session`, {
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

    window.closeCart = function () {
        if (cartModal) {
            cartModal.style.display = "none";
        }
    };

    updateCartCount();
});
