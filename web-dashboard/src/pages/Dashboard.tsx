import { useEffect, useState } from 'react';
import api from '../services/api';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Wind, Thermometer, LogOut, Rocket, MapPin, Sun, Moon, Droplets, Sparkles, AlertTriangle, BarChart3, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);

  const [limit, setLimit] = useState<number>(20); // Padrão: 20 registros

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [logsRes, insightsRes] = await Promise.all([
        api.get('/weather/logs'),
        api.get('/weather/insights')
      ]);
      setLogs(logsRes.data);
      setInsights(insightsRes.data);
    } catch (error) {
      console.error("Erro ao buscar dados", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gdash_token');
    navigate('/');
  };

  const downloadReport = (type: 'csv' | 'xlsx') => {
    window.open(`http://localhost:3000/api/weather/export/${type}`, '_blank');
  };

  const filteredLogs = logs.slice(0, limit);

  const chartData = [...filteredLogs].reverse().map(log => ({
    time: new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    temp: log.temperature,
    humidity: log.humidity,
    wind: log.windSpeed
  }));

  const lastLog = logs[0] || {};
  const isDay = lastLog.isDay === 1;
  const cityName = lastLog.city ? lastLog.city : "Atualizando...";

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            Monitoramento Climático
            {lastLog.city && (
                <span className={`text-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border ${isDay ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-indigo-900 border-indigo-700 text-yellow-300'}`}>
                    {isDay ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
                    {isDay ? 'Dia' : 'Noite'}
                </span>
            )}
          </h1>
          <div className="flex items-center text-gray-500 mt-2 bg-white px-3 py-1 rounded-lg shadow-sm w-fit">
            <MapPin className="w-4 h-4 mr-2 text-indigo-600" />
            <span className="font-medium text-lg text-gray-800">{cityName}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
            <Button variant="primary" className="bg-indigo-600 hover:bg-indigo-700 shadow-sm" onClick={() => navigate('/explorer')}>
                <Rocket className="w-4 h-4 mr-2" />
                Explorar APIs
            </Button>
            <Button variant="outline" onClick={() => downloadReport('csv')}>Exportar CSV</Button>
            <Button variant="outline" onClick={() => downloadReport('xlsx')}>Exportar Excel</Button>
            <Button variant="ghost" onClick={handleLogout}><LogOut className="w-5 h-5" /></Button>
        </div>
      </div>

      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="relative overflow-hidden border-t-4 border-red-500 shadow-md">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500">Temperatura</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2 tracking-tight">{lastLog.temperature ?? '--'}°C</p>
                </div>
                <div className="p-3 bg-red-50 rounded-full text-red-500"><Thermometer className="w-6 h-6" /></div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">Sensação:</span><span className="font-bold text-gray-700">{lastLog.feelsLike ?? '--'}°C</span>
            </div>
        </Card>

        <Card className="border-t-4 border-blue-500 shadow-md">
            <div className="flex justify-between items-start">
                <div><p className="text-sm font-medium text-gray-500">Umidade</p><p className="text-4xl font-bold text-gray-900 mt-2 tracking-tight">{lastLog.humidity ?? '--'}%</p></div>
                <div className="p-3 bg-blue-50 rounded-full text-blue-500"><Droplets className="w-6 h-6" /></div>
            </div>
             <div className="mt-4 pt-3 border-t border-gray-100 text-sm text-gray-400">{lastLog.humidity > 60 ? 'Umidade Alta' : 'Umidade Normal'}</div>
        </Card>

        <Card className="border-t-4 border-gray-500 shadow-md">
            <div className="flex justify-between items-start">
                <div><p className="text-sm font-medium text-gray-500">Vento</p><p className="text-4xl font-bold text-gray-900 mt-2 tracking-tight">{lastLog.windSpeed ?? '--'} <span className="text-lg text-gray-500 font-normal">km/h</span></p></div>
                <div className="p-3 bg-gray-100 rounded-full text-gray-600"><Wind className="w-6 h-6" /></div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 text-sm text-gray-400">Velocidade atual</div>
        </Card>

         <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 shadow-md relative overflow-hidden">
             <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 rounded-full filter blur-xl opacity-20 -mr-10 -mt-10"></div>
             <div className="flex flex-col h-full">
                <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-600" />Insights Inteligentes</h3>
                {insights ? (
                    <div className="flex flex-col gap-2 h-full justify-between">
                         <div className="space-y-2">
                            {insights.alerts.map((alert: string, idx: number) => (
                                <div key={idx} className="bg-white/60 p-2 rounded-md text-xs font-medium text-indigo-800 border border-indigo-100 flex items-start gap-2 shadow-sm">
                                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0 text-indigo-500" />{alert}
                                </div>
                            ))}
                         </div>
                         <div className="mt-2 text-xs text-indigo-600 bg-white p-2 rounded border border-indigo-50 text-center">{insights.trend}</div>
                    </div>
                ) : (<div className="text-xs text-indigo-400 flex items-center justify-center h-full">Analisando dados...</div>)}
             </div>
        </Card>
      </div>

      {/* ÁREA DE FILTROS E GRÁFICOS */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-8">
        <div className="flex flex-wrap justify-between items-center mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Análise Gráfica
            </h3>

            {/* BÔNUS: FILTROS DE TEMPO */}
            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                <Filter className="w-4 h-4 text-gray-400 ml-2" />
                <span className="text-xs font-medium text-gray-500 mr-2">Filtrar:</span>
                {[10, 30, 60, 100].map((val) => (
                    <button
                        key={val}
                        onClick={() => setLimit(val)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                            limit === val
                            ? 'bg-white text-indigo-600 shadow-sm border border-gray-200'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {val === 100 ? 'Tudo' : `${val} min`}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gráfico 1: Linha */}
            <div className="h-[300px] w-full">
                <p className="text-sm font-medium text-gray-500 mb-2 text-center">Variação Térmica</p>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                        <Legend />
                        <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{r: 6}} name="Temperatura (°C)" />
                        <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={3} dot={false} name="Umidade (%)" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Gráfico 2: Barras */}
            <div className="h-[300px] w-full border-l border-gray-100 pl-0 lg:pl-8">
                 <p className="text-sm font-medium text-gray-500 mb-2 text-center">Intensidade do Vento</p>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} cursor={{fill: '#f3f4f6'}} />
                        <Legend />
                        <Bar dataKey="wind" fill="#6b7280" radius={[4, 4, 0, 0]} name="Vento (km/h)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};