document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) return window.location.href = "./login.html";

  let currentBalance = 0;

  /* =========================
     FETCH WALLET
  ========================== */
  fetch("https://remj82.onrender.com/api/wallet/me", {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(async res => {
      if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        window.location.href = "./login.html";
        return;
      }
      if (!res.ok) throw new Error("Wallet load failed");
      return res.json();
    })
    .then(data => {
      if (!data) return;

      currentBalance = Number(data.walletBalance || 0);

      document.querySelector(".balance").textContent = `$${currentBalance.toFixed(2)}`;
      document.querySelector(".wallet-address").textContent = data.walletAddress;
      document.querySelector("#profileAddress").textContent = data.walletAddress;
      document.querySelector("#withdrawAmount").placeholder =
        `Amount (Max: $${currentBalance.toFixed(2)})`;

      document.querySelector(".profile-icon").textContent = "U";

      loadAssets();
      loadTransactions();
    })
    .catch(err => {
      console.error(err);
      alert("Failed to load wallet. Try again.");
    });

  /* =========================
     BINANCE PRICES
  ========================== */
  const symbols = ['BNBUSDT','BTCUSDT','ETHUSDT','SOLUSDT','XRPUSDT','ADAUSDT','DOGEUSDT','TRXUSDT'];
  const nameMap = {
    bnb:'BNB', btc:'Bitcoin', eth:'Ethereum', sol:'Solana',
    xrp:'Ripple', ada:'Cardano', doge:'Dogecoin', trx:'TRON'
  };
  const mockHoldings = { bnb:5, btc:0.05, eth:0.4, sol:10, xrp:2000, ada:500, doge:5000, trx:10000 };

  async function fetchPrices() {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr`);
    return res.json();
  }

  async function loadAssets() {
    const list = document.getElementById("assetList");
    list.innerHTML = "";

    const prices = await fetchPrices();
    symbols.forEach(sym => {
      const coin = prices.find(p => p.symbol === sym);
      if (!coin) return;

      const id = sym.replace("USDT","").toLowerCase();
      const qty = mockHoldings[id] || 0;
      const price = Number(coin.lastPrice);
      const value = qty * price;
      const change = Number(coin.priceChangePercent);

      list.innerHTML += `
        <li class="asset-item">
          <span>${nameMap[id]} (${id.toUpperCase()})</span>
          <span>$${price.toFixed(2)}</span>
          <span class="${change >= 0 ? 'positive':'negative'}">${change.toFixed(2)}%</span>
          <span>$${value.toFixed(2)}</span>
        </li>
      `;
    });

    setTimeout(loadAssets, 60000);
  }

  /* =========================
     TRANSACTIONS
  ========================== */
  async function loadTransactions() {
    try {
      const res = await fetch("https://remj82.onrender.com/api/transactions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;

      const txs = await res.json();
      const list = document.getElementById("transactionList");
      list.innerHTML = "";

      txs.forEach(tx => {
        list.innerHTML += `
          <li>
            <span>${tx.type}</span>
            <span>$${tx.amount}</span>
            <span>${tx.status}</span>
          </li>
        `;
      });
    } catch {}
  }

  /* =========================
     WITHDRAW (FIXED)
  ========================== */
  const withdrawBtn = document.getElementById("withdrawBtn");
  const withdrawModal = document.getElementById("withdrawModal");
  const closeWithdraw = document.getElementById("closeWithdraw");
  const confirmWithdraw = document.getElementById("confirmWithdraw");

  withdrawBtn.onclick = () => withdrawModal.style.display = "flex";
  closeWithdraw.onclick = () => withdrawModal.style.display = "none";

  confirmWithdraw.onclick = async () => {
    const amount = parseFloat(document.getElementById("withdrawAmount").value);
    const phone = document.getElementById("phoneNumber").value.trim();

    if (!phone || isNaN(amount) || amount <= 0 || amount > currentBalance) {
      alert("Invalid withdrawal details");
      return;
    }

    try {
      const res = await fetch("https://remj82.onrender.com/api/wallet/withdraw", {
        method: "POST",
        headers: {
          "Content-Type":"application/json",
          Authorization:`Bearer ${token}`
        },
        body: JSON.stringify({ amount, phone })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const confirmPay = confirm(
        `Withdraw $${amount}\nKES ${data.kesAmount}\nTo phone: ${phone}`
      );

      if (!confirmPay) {
        await fetch("https://remj82.onrender.com/api/wallet/withdraw/cancel", {
          method:"POST",
          headers:{
            "Content-Type":"application/json",
            Authorization:`Bearer ${token}`
          },
          body:JSON.stringify({ transactionId:data.transactionId })
        });
        alert("Withdrawal cancelled");
        return;
      }

      alert("Withdrawal pending PayHero confirmation");
      withdrawModal.style.display = "none";
      loadTransactions();

    } catch (err) {
      alert(err.message);
    }
  };

  /* =========================
     LOGOUT
  ========================== */
  document.getElementById("logoutBtn").onclick = () => {
    localStorage.clear();
    window.location.href = "./login.html";
  };
});
