import { useEffect, useState } from 'react';
import api from '../services/api';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gamepad2, Spade, RefreshCw, Layers, Heart, Shield, Swords, Zap, Star, Ruler, Weight, Activity } from 'lucide-react';

export const Explorer = () => {
  const [activeTab, setActiveTab] = useState<'pokemon' | 'deck'>('pokemon');
  const navigate = useNavigate();

  const [listData, setListData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({ next: false, previous: false });
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [deckId, setDeckId] = useState<string | null>(null);
  const [currentCard, setCurrentCard] = useState<any>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [loadingCard, setLoadingCard] = useState(false);

  useEffect(() => {
    if (activeTab === 'pokemon') {
        fetchPokemonList();
    } else if (activeTab === 'deck' && !deckId) {
        startNewDeck();
    }
  }, [activeTab, page]);

  const getIdFromUrl = (url: string) => {
      if (!url) return '';
      const parts = url.split('/');
      return parts.filter(p => !!p).pop();
  };
  
  const getImageUrl = (url: string) => {
    const id = getIdFromUrl(url);
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  };

  const fetchPokemonList = async () => {
    setLoading(true);
    try {
      const response = await api.get('/external/pokemon', { params: { page } });
      setListData(response.data.results);
      setMeta({ next: !!response.data.next, previous: !!response.data.previous });
    } catch (error) { console.error("Erro Pokémon", error); }
    finally { setLoading(false); }
  };

  const handleOpenDetails = async (item: any) => {
    setSelectedItem(item);
    setLoadingDetails(true);
    setDetails(null);
    try {
      const id = getIdFromUrl(item.url);
      const response = await api.get(`/external/pokemon/${id}`);
      setDetails(response.data);
    } catch (error) { console.error("Erro detalhes"); }
    finally { setLoadingDetails(false); }
  };

  const startNewDeck = async () => {
      setLoadingCard(true);
      try {
          const res = await api.get('/external/deck/new');
          setDeckId(res.data.deck_id);
          setRemaining(res.data.remaining);
          setCurrentCard(null);
      } catch (error) { console.error("Erro Deck", error); }
      finally { setLoadingCard(false); }
  };

  const drawCard = async () => {
      if (!deckId) return;
      setLoadingCard(true);
      try {
          const res = await api.get(`/external/deck/${deckId}/draw`);
          if (res.data.cards && res.data.cards.length > 0) {
              setCurrentCard(res.data.cards[0]);
              setRemaining(res.data.remaining);
          }
      } catch (error) { console.error("Erro ao comprar carta", error); }
      finally { setLoadingCard(false); }
  };

  const getStatIcon = (name: string) => {
      if (name.includes('hp')) return <Heart className="w-4 h-4 text-red-500" />;
      if (name.includes('attack')) return <Swords className="w-4 h-4 text-orange-500" />;
      if (name.includes('defense')) return <Shield className="w-4 h-4 text-blue-500" />;
      if (name.includes('speed')) return <Zap className="w-4 h-4 text-yellow-500" />;
      return <Star className="w-4 h-4 text-purple-500" />;
  };

  const getStatColor = (name: string) => {
      if (name.includes('hp')) return 'bg-red-500';
      if (name.includes('attack')) return 'bg-orange-500';
      if (name.includes('defense')) return 'bg-blue-500';
      if (name.includes('speed')) return 'bg-yellow-400';
      return 'bg-purple-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Explorador de APIs</h1>
      </div>

      {/* Navegação de Abas */}
      <div className="flex gap-4 mb-8 border-b border-gray-200 pb-1">
        <button
            onClick={() => setActiveTab('pokemon')}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold transition-all ${activeTab === 'pokemon' ? 'bg-white text-indigo-600 border-t border-x border-gray-200 -mb-px' : 'text-gray-500 hover:text-gray-700'}`}
        >
            <Gamepad2 /> PokéAPI
        </button>
        <button
            onClick={() => setActiveTab('deck')}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold transition-all ${activeTab === 'deck' ? 'bg-white text-emerald-600 border-t border-x border-gray-200 -mb-px' : 'text-gray-500 hover:text-gray-700'}`}
        >
            <Spade /> Cartas API
        </button>
      </div>

      {/* --- CONTEÚDO POKÉMON --- */}
      {activeTab === 'pokemon' && (
        <>
            {loading ? (
                <div className="text-center py-20 text-gray-500 animate-pulse">Carregando Pokémons...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                    {listData.map((item, index) => (
                        <Card key={index} className="group cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 border-t-4 border-yellow-400 overflow-hidden">
                            <div onClick={() => handleOpenDetails(item)}>
                                <div className="h-48 w-full bg-gray-100 mb-4 p-4 rounded-lg flex items-center justify-center group-hover:bg-yellow-50 transition-colors">
                                    <img src={getImageUrl(item.url)} alt={item.name} className="h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=?')} />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold text-lg capitalize text-gray-800 group-hover:text-yellow-600">{item.name}</h3>
                                    <p className="text-xs text-gray-400 mt-1">Ver detalhes</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            <div className="flex justify-center gap-4 pb-10">
                <Button variant="outline" disabled={!meta.previous} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                <span className="flex items-center font-bold text-gray-700">Página {page}</span>
                <Button variant="outline" disabled={!meta.next} onClick={() => setPage(p => p + 1)}>Próxima</Button>
            </div>
        </>
      )}

      {/* --- CONTEÚDO BARALHO --- */}
      {activeTab === 'deck' && (
          <div className="flex flex-col items-center justify-center py-8 animate-in fade-in duration-500">
              <div className="bg-emerald-800 p-8 rounded-3xl shadow-2xl border-4 border-emerald-900 w-full max-w-2xl relative">
                  
                  {/* Mesa de Jogo */}
                  <div className="flex justify-between items-start mb-8 text-emerald-100">
                      <div>
                          <h2 className="text-2xl font-bold flex items-center gap-2"><Spade className="fill-current" /> Cassino GDASH</h2>
                          <p className="text-sm opacity-70">Deck ID: {deckId || '...'}</p>
                      </div>
                      <div className="text-right bg-emerald-900/50 px-4 py-2 rounded-lg">
                          <p className="text-xs uppercase tracking-widest opacity-70">Cartas Restantes</p>
                          <p className="text-3xl font-mono font-bold text-yellow-400">{remaining}</p>
                      </div>
                  </div>

                  {/* Área da Carta */}
                  <div className="h-80 flex items-center justify-center mb-8 relative">
                      {loadingCard ? (
                          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-400"></div>
                      ) : currentCard ? (
                          <div className="relative group">
                              <img src={currentCard.image} alt={currentCard.code} className="h-72 rounded-xl shadow-2xl transform transition-transform group-hover:scale-105" />
                              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                                  {currentCard.value} OF {currentCard.suit}
                              </div>
                          </div>
                      ) : (
                        <div className="h-72 w-52 bg-emerald-900 rounded-xl border-4 border-white/20 flex items-center justify-center">
                            <Layers className="w-16 h-16 text-white/20" />
                            <p className="absolute text-emerald-100/50 font-bold">Compre uma carta</p>
                        </div>
                      )}
                  </div>

                  {/* Controles */}
                  <div className="flex justify-center gap-4">
                      <Button
                        onClick={drawCard}
                        disabled={remaining === 0 || loadingCard}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-4 text-lg shadow-lg border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1"
                      >
                          {remaining === 0 ? 'Fim do Baralho' : 'Comprar Carta'}
                      </Button>
                      <Button variant="outline" onClick={startNewDeck} className="border-emerald-500 text-emerald-100 hover:bg-emerald-700 hover:text-white">
                          <RefreshCw className="w-5 h-5 mr-2" /> Reiniciar
                      </Button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL POKÉMON DETALHADO */}
      <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title={details?.name || selectedItem?.name || 'Carregando...'}>
         {(loadingDetails || !details) ? <div className="h-20 flex justify-center items-center">Carregando...</div> : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Lado Esquerdo: Imagem e Físico */}
                 <div className="space-y-4">
                     <div className="flex justify-center bg-yellow-50 rounded-xl p-8 border border-yellow-100">
                         <img src={details.image} className="h-56 drop-shadow-xl hover:scale-110 transition-transform" />
                     </div>
                     <div className="flex gap-2 justify-center">
                         {details.types.map((t:any) => (
                             <span key={t} className="px-4 py-1.5 bg-gray-800 text-white text-xs font-bold rounded-full uppercase tracking-wider">{t}</span>
                         ))}
                     </div>
                     <div className="grid grid-cols-2 gap-4 text-center">
                         <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                             <Ruler className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                             <p className="text-xs text-gray-500 uppercase">Altura</p>
                             <b className="text-lg">{details.height}m</b>
                         </div>
                         <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                             <Weight className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                             <p className="text-xs text-gray-500 uppercase">Peso</p>
                             <b className="text-lg">{details.weight}kg</b>
                         </div>
                     </div>
                 </div>

                 {/* Lado Direito: Stats e Habilidades */}
                 <div className="space-y-6">
                     <div>
                         <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                             <Activity className="w-4 h-4 text-indigo-500" /> Estatísticas Base
                         </h3>
                         <div className="space-y-3">
                             {details.stats.map((s: any) => (
                                 <div key={s.name}>
                                     <div className="flex justify-between text-xs mb-1 uppercase font-bold text-gray-500">
                                         <span className="flex items-center gap-1">
                                             {getStatIcon(s.name)}
                                             {s.name.replace('-', ' ')}
                                         </span>
                                         <span>{s.value}</span>
                                     </div>
                                     <div className="w-full bg-gray-200 rounded-full h-2">
                                         <div
                                            className={`h-2 rounded-full ${getStatColor(s.name)}`}
                                            style={{ width: `${Math.min(s.value, 100)}%` }}
                                         ></div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                         {details.base_experience && (
                            <div className="mt-4 text-xs text-gray-500 text-right">
                                Base XP: <span className="font-bold text-indigo-600">{details.base_experience}</span>
                            </div>
                         )}
                     </div>

                     <div>
                         <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                             <Star className="w-4 h-4 text-yellow-500" /> Habilidades
                         </h3>
                         <div className="flex flex-wrap gap-2">
                             {details.abilities.map((a: string) => (
                                 <span key={a} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg capitalize border border-indigo-100">
                                     {a.replace('-', ' ')}
                                 </span>
                             ))}
                         </div>
                     </div>
                 </div>
             </div>
         )}
      </Modal>
    </div>
  );
};