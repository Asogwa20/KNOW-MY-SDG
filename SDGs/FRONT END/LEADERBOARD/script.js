const tbody = document.getElementById("leaderboardBody");
const emptyState = document.getElementById("leaderboardEmpty");
let currentBoard = "general";

function getField(board) {
  if (board === "general") return "generalScore";
  return `${board}Score`;
}

function render(board) {
  const users = window.SDGApp.getUsers().slice().sort((left, right) => {
    return Number(right[getField(board)] || 0) - Number(left[getField(board)] || 0);
  });

  tbody.innerHTML = "";
  emptyState.classList.toggle("hidden", users.length > 0);

  users.forEach((user, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? "Gold" : rank === 2 ? "Silver" : rank === 3 ? "Bronze" : "-";
    const row = document.createElement("tr");
    if (rank <= 3) {
      row.classList.add(`rank-${rank}`);
    }
    row.innerHTML = `
      <td>${rank}</td>
      <td><span class="medal medal-${medal.toLowerCase()}">${medal}</span></td>
      <td><img class="leader-avatar" src="${user.avatar || "../Edited images/gem.jpg"}" alt="${user.username || "student"} avatar"></td>
      <td>${user.firstName || "-"}</td>
      <td>${user.username || "-"}</td>
      <td>${user.country || "-"}</td>
      <td>${user.state || "-"}</td>
      <td>${user.classRole || "-"}</td>
      <td>${user.role || "Student"}</td>
      <td>${user[getField(board)] || 0}</td>
    `;
    tbody.appendChild(row);
  });
}

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    currentBoard = button.dataset.board;
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    render(currentBoard);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  render(currentBoard);
});

window.addEventListener("sdg:data", () => {
  render(currentBoard);
});
