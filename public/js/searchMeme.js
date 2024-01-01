$("form").submit(function (e) {
  e.preventDefault();
  const search = $("form #search").val()
  if (search.length == 0) return;
  $.ajax({
    type: "POST",
    url: "http://localhost/memes/generate-images",
    data: { search: $("form #search").val() },
    beforeSend: () => {
      $("form button").hide()
        $("#notification").fadeIn();
        $("#notification").removeClass("bg-green-200 text-green-700");
        $("#notification").removeClass("bg-red-200 text-red-700");
        $("#notification").addClass("bg-blue-200 text-blue-700");
        $("#notification span").html("Cargando imagenes en el servidor");
    }
  })
    .done((data) => {
      $("form button").fadeIn()
      $("#card").fadeIn()
      $("#notification").removeClass("bg-blue-200 text-blue-700");
      $("#notification").addClass("bg-green-200 text-green-700");
      $("#notification").html(`<svg
          xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 inline-block mr-2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg><span> Generacion finalizada para ${data}</span>`);
      $("#meme-name-display").html(data)
    })
    .fail((err) => {
      $("form button").fadeIn()
      $("#notification").removeClass("bg-blue-200 text-blue-700");
        $("#notification").addClass("bg-red-200 text-red-700");
        $("#notification").html(err.responseText);
    })
});