document.addEventListener('DOMContentLoaded', async function () {
  // ----------- Referências DOM -----------
  const mapaContainer = document.getElementById('mapa-container');
  const mapaMensagem = document.getElementById('mapa-mensagem');
  const buscaManualContainer = document.getElementById('busca-manual-container');
  const inputEndereco = document.getElementById('endereco-input');
  const btnBuscar = document.getElementById('btn-buscar-endereco');

  if (!mapaContainer) {
    console.error('mapa-container não encontrado no DOM.');
    return;
  }

  // ----------- Variáveis Globais -----------
  let mapa, infoWindow, markers = [];
  let MapClass, AdvancedMarkerElement, PinElement, Place;

  // ----------- Carrega Bibliotecas -----------
  async function carregarBibliotecas() {
    try {
      const mapsLib = await google.maps.importLibrary("maps");
      MapClass = mapsLib.Map || google.maps.Map;

      const markerLib = await google.maps.importLibrary("marker");
      AdvancedMarkerElement = markerLib.AdvancedMarkerElement;
      PinElement = markerLib.PinElement;

      const placesLib = await google.maps.importLibrary("places");
      Place = placesLib.Place;
    } catch (err) {
      console.warn("Falha ao carregar importLibrary, tentando globals:", err);
      MapClass = (google.maps && google.maps.Map) || null;
    }
  }

  // ----------- InfoWindow -----------
  function garanteInfoWindow() {
    if (!infoWindow && google.maps && google.maps.InfoWindow) {
      infoWindow = new google.maps.InfoWindow({ padding: 0 });
    }
  }

  // ----------- Geolocalização -----------
  async function obterPosicaoUsuario() {
    try {
      return await new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('Sem geolocation'));
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });
    } catch (error) {
      return null;
    }
  }

  // ----------- Inicializa o Mapa -----------
  async function inicializarMapa() {
    await carregarBibliotecas();
    garanteInfoWindow();

    const posicao = await obterPosicaoUsuario();
    const centro = posicao
      ? { lat: posicao.coords.latitude, lng: posicao.coords.longitude }
      : { lat: -14.2350, lng: -51.9253 };

    mapa = new MapClass(mapaContainer, {
      center: centro,
      zoom: posicao ? 12 : 4,
      disableDefaultUI: true,
      mapId: 'SANGUE_CONNECT_MAP'
    });

    if (posicao) {
      if (mapaMensagem) mapaMensagem.textContent = 'Buscando locais...';
      await buscarHemocentros(centro);
    } else {
      habilitarBuscaManual();
    }
  }

  // ----------- Limpar Marcadores -----------
  function limparMarcadores() {
    markers.forEach(m => {
      try { m.setMap && m.setMap(null); } catch { }
    });
    markers = [];
  }

  // ----------- Criar Marcador -----------
  function criarMarcador(lugar) {
    if (!lugar || !lugar.location) return;
    let marcador;

    if (AdvancedMarkerElement && PinElement) {
      const pinGota = new PinElement({
        background: '#c0392b',
        borderColor: '#ffffff',
        glyphColor: '#ffffff',
        glyph: '🩸'
      });
      marcador = new AdvancedMarkerElement({
        map: mapa,
        position: lugar.location,
        title: lugar.displayName,
        content: pinGota.element
      });
    } else {
      marcador = new google.maps.Marker({
        map: mapa,
        position: lugar.location,
        title: lugar.displayName
      });
    }

    markers.push(marcador);

    const endereco = lugar.formattedAddress || '';
    const nomeLocalCodificado = encodeURIComponent(lugar.displayName || '');
    const urlAgendamento = `/agendar_doacao?local=${nomeLocalCodificado}`;
    const conteudoInfoWindow = `
      <div class="custom-info-window">
        <div class="iw-header">
          <span class="iw-close-btn" style="cursor:pointer">&times;</span>
          <h3 class="iw-title">${lugar.displayName || 'Local'}</h3>
        </div>
        <p class="iw-address">${endereco}</p>
        <a href="${urlAgendamento}" class="iw-button">Agendar Doação</a>
      </div>
    `;

    if (marcador.addListener) {
      marcador.addListener('click', () => {
        garanteInfoWindow();
        infoWindow.close();
        infoWindow.setContent(conteudoInfoWindow);
        infoWindow.open(mapa, marcador);
      });
    }

    google.maps.event.addListener(infoWindow, 'domready', () => {
      const closeBtn = document.querySelector('.iw-close-btn');
      if (closeBtn) closeBtn.onclick = () => infoWindow.close();
    });
  }

  // ----------- Buscar Hemocentros -----------
  async function buscarHemocentros(locationObj) {
    limparMarcadores();
    if (mapaMensagem) {
      mapaMensagem.style.display = 'block';
      mapaMensagem.textContent = 'Buscando locais...';
    }

    // fallback PlacesService
    if (!Place || !Place.searchByText) {
      if (google.maps.places) {
        const service = new google.maps.places.PlacesService(mapa);
        return new Promise(resolve => {
          service.textSearch({
            query: 'hemocentro OR "banco de sangue"',
            locationBias: locationObj,
          }, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
              results.forEach(res => criarMarcador({
                displayName: res.name,
                location: res.geometry.location,
                formattedAddress: res.formatted_address
              }));
              mapaMensagem.style.display = 'none';
            } else mapaMensagem.textContent = 'Nenhum local encontrado.';
            resolve();
          });
        });
      } else {
        mapaMensagem.textContent = 'Places API não disponível.';
        return;
      }
    }

    // API nova
    try {
      const request = {
        textQuery: 'hemocentro OR "banco de sangue"',
        locationBias: locationObj,
        language: 'pt-BR',
        region: 'br',
        fields: ['displayName', 'location', 'formattedAddress'],
      };
      const { places } = await Place.searchByText(request);
      if (places && places.length) {
        mapaMensagem.style.display = 'none';
        places.forEach(l => criarMarcador(l));
      } else {
        mapaMensagem.textContent = 'Nenhum local encontrado nas proximidades.';
      }
    } catch (err) {
      console.error('Erro na busca Place.searchByText:', err);
      mapaMensagem.textContent = 'Erro ao buscar locais.';
    }
  }

  // ----------- Habilitar Busca Manual -----------
  function habilitarBuscaManual() {
    buscaManualContainer.style.display = 'block';
    const geocoder = google.maps.Geocoder ? new google.maps.Geocoder() : null;

    async function executarBusca() {
      const endereco = inputEndereco.value.trim();
      if (!endereco) return;
      if (!geocoder) return alert('Geocoder não disponível.');

      geocoder.geocode({ address: endereco }, async (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          mapa.setCenter(location);
          mapa.setZoom(12);
          if (mapaMensagem) mapaMensagem.textContent = 'Buscando locais...';
          await buscarHemocentros(location);
        } else alert('Endereço não encontrado.');
      });
    }

    btnBuscar.addEventListener('click', executarBusca);
    inputEndereco.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executarBusca();
      }
    });
  }

  // ----------- Start -----------
  inicializarMapa();
});





