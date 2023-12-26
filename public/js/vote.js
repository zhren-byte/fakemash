document.addEventListener("keydown", (e) => {
  e.preventDefault();
  if (e.key == "ArrowLeft") return voteImg($(".images")[0]);
  if (e.key == "ArrowRight") return voteImg($(".images")[1]);
});
$("input").keypress(function () {
  $("span").text((i += 1));
});
function voteImg(e) {
  const winner = $(e).attr("alt");
  const loser = $(".images").not(e).attr("alt");
  // const winnerWins = localStorage.getItem(`${winner}_wins`) || 0;
  // localStorage.setItem(`${winner}_wins`, parseInt(winnerWins) + 1);

  // if (parseInt(winnerWins) + 1 >= 5) return updateImages(winner);
  $.ajax({
    type: "POST",
    url: location.pathname + "/vote",
    data: {
      winner: winner,
      loser: loser,
    },
    success: function (res) {
      if(location.pathname === '/memes') return $(".images").not(e)[0].outerHTML = `<img onclick="voteImg(this)" class="images" width="500" height="500" src="${res.url}" alt="${res.name}" />`;
      return $(".images").not(e)[0].outerHTML = `<img onclick="voteImg(this)" class="images" width="500" height="500" src="https://this-person-does-not-exist.com${res.url}" alt="${res.name}" />`;
    },
  });
}
async function updateImages(winner) {
  // Realizar una solicitud al servidor para obtener nuevas imágenes
  try {
    const response = await fetch("/get-new-images"); // Asegúrate de tener una ruta que devuelva nuevas imágenes en el servidor
    const newImages = await response.json();

    $(
      ".images"
    )[0].outerHTML = `<img onclick="voteImg(this)" class="images" width="500" height="500" src="${
      "https://this-person-does-not-exist.com/" + newImages[0].url
    }" alt="${newImages[0].url}" />`;
    $(
      ".images"
    )[1].outerHTML = `<img onclick="voteImg(this)" class="images" width="500" height="500" src="${
      "https://this-person-does-not-exist.com/" + newImages[1].url
    }" alt="${newImages[1].url}" />`;

    localStorage.setItem(`${winner}_wins`, 0);
  } catch (error) {
    console.error("Error al obtener nuevas imágenes:", error);
  }
}
