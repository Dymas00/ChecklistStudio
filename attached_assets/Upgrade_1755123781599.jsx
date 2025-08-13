import React, { useState, useRef, useEffect, useCallback } from 'react';

// Componente para o Canvas de Assinatura
const SignatureCanvas = ({ onSign, onClear, hasSigned }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const getCtx = useCallback(() => {
        return canvasRef.current?.getContext('2d');
    }, []);

    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = getCtx();
        if (!canvas || !ctx) return;

        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const rect = canvas.getBoundingClientRect();
        
        if (canvas.width !== rect.width * ratio || canvas.height !== rect.height * ratio) {
            canvas.width = rect.width * ratio;
            canvas.height = rect.height * ratio;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            ctx.scale(ratio, ratio);
            ctx.strokeStyle = "#334155";
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }, [getCtx]);

    useEffect(() => {
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [resizeCanvas]);

    const getCoords = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        e.preventDefault();
        const coords = getCoords(e);
        const ctx = getCtx();
        if (!coords || !ctx) return;
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const coords = getCoords(e);
        const ctx = getCtx();
        if (!coords || !ctx) return;
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            onSign(canvas.toDataURL());
        }
    };

    const clearCanvas = () => {
        const ctx = getCtx();
        const canvas = canvasRef.current;
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            onClear();
        }
    };

    return (
        <div>
            <div className="mt-1 relative">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className={`w-full h-48 md:h-52 rounded-lg cursor-crosshair`}
                    style={{ border: `2px dashed ${!hasSigned ? '#ef4444' : '#cbd5e1'}` }}
                />
            </div>
            <button type="button" onClick={clearCanvas} className="mt-2 text-sm text-red-600 hover:text-red-800">
                Limpar Assinatura
            </button>
        </div>
    );
};

// Componente para Item de Evidência
const EvidenceItem = ({ question, name, value, onChange }) => {
    const handleRadioChange = (e) => {
        onChange(name, { choice: e.target.value, photo: null, obs: '' });
    };

    const handleFileChange = (e) => {
        onChange(name, { ...value, photo: e.target.files[0] });
    };

    const handleObsChange = (e) => {
        onChange(name, { ...value, obs: e.target.value });
    };

    return (
        <div>
            <p className="block text-sm font-medium text-slate-700">{question}*</p>
            <div className="mt-2 flex">
                <label className="inline-flex items-center cursor-pointer mr-4">
                    <input type="radio" name={name} value="sim" checked={value.choice === 'sim'} onChange={handleRadioChange} className="sr-only" required />
                    <span className="w-6 h-6 border-2 border-slate-300 rounded-full mr-2 flex items-center justify-center">
                        {value.choice === 'sim' && <span className="w-3 h-3 bg-red-600 rounded-full"></span>}
                    </span>
                    Sim
                </label>
                <label className="inline-flex items-center cursor-pointer">
                    <input type="radio" name={name} value="nao" checked={value.choice === 'nao'} onChange={handleRadioChange} className="sr-only" />
                     <span className="w-6 h-6 border-2 border-slate-300 rounded-full mr-2 flex items-center justify-center">
                        {value.choice === 'nao' && <span className="w-3 h-3 bg-red-600 rounded-full"></span>}
                    </span>
                    Não
                </label>
            </div>
            {value.choice === 'sim' && (
                <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700">Anexar Foto*</label>
                    <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" required />
                </div>
            )}
            {value.choice === 'nao' && (
                <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700">Observações*</label>
                    <textarea value={value.obs} onChange={handleObsChange} rows="3" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" required></textarea>
                </div>
            )}
        </div>
    );
};

// Componente para Opções de Rádio
const RadioGroup = ({ name, value, onChange, options, legend }) => (
    <div>
        <p className="block text-sm font-medium text-slate-700">{legend}*</p>
        <div className="mt-2 flex">
            {options.map(opt => (
                <label key={opt.value} className="inline-flex items-center cursor-pointer mr-4">
                    <input type="radio" name={name} value={opt.value} checked={value === opt.value} onChange={onChange} className="sr-only" required />
                    <span className="w-6 h-6 border-2 border-slate-300 rounded-full mr-2 flex items-center justify-center">
                        {value === opt.value && <span className="w-3 h-3 bg-red-600 rounded-full"></span>}
                    </span>
                    {opt.label}
                </label>
            ))}
        </div>
    </div>
);


// Componente Modal
const Modal = ({ title, message, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm mx-auto">
                <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-slate-600">{message}</p>
                <button onClick={onClose} className="mt-6 w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                    Fechar
                </button>
            </div>
        </div>
    );
};


// Componente Principal da Aplicação
export default function App() {
    const [formData, setFormData] = useState({
        analystName: '',
        analystEmail: '',
        analystConsent: '',
        techConsent: '',
        techName: '',
        techPhone: '',
        techCpf: '',
        techSelfie: null,
        contractor: '',
        otherContractor: '',
        storeCode: '',
        storeManager: '',
        storePhone: '',
        connectivityType: '',
        designation: '',
        speedTest: '',
        speedTestPhoto: null,
        ipWan: { choice: '', photo: null, obs: '' },
        vpn: { choice: '', photo: null, obs: '' },
        aps: { choice: '', photo: null, obs: '' },
        nomenclature: { choice: '', photo: null, obs: '' },
        notes: { choice: '', photo: null, obs: '' },
        validationCode: '',
        signature: '',
    });
    
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });
    const [isSignatureValid, setIsSignatureValid] = useState(true);

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'file' ? files[0] : value
        }));
    };

    const handleEvidenceChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSign = (dataUrl) => {
        setFormData(prev => ({ ...prev, signature: dataUrl }));
        setIsSignatureValid(true);
    };

    const handleClearSign = () => {
        setFormData(prev => ({ ...prev, signature: '' }));
        setIsSignatureValid(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const form = e.target;
        
        if (!form.checkValidity() || !formData.signature) {
            setIsSignatureValid(!!formData.signature);
            setModal({
                isOpen: true,
                title: 'Erro de Validação',
                message: 'Por favor, preencha todos os campos obrigatórios (*), incluindo a assinatura.'
            });
            // Encontra o primeiro campo inválido para focar nele
            const firstInvalidField = form.querySelector(':invalid');
            if (firstInvalidField) {
                firstInvalidField.focus();
            }
            return;
        }

        console.log("Formulário Enviado:", formData);
        setModal({
            isOpen: true,
            title: 'Sucesso!',
            message: 'O checklist foi preenchido com sucesso e está pronto para ser enviado.'
        });
    };

    return (
        <>
            <style>{`
                body { font-family: 'Inter', sans-serif; }
            `}</style>
            <div className="bg-slate-50 text-slate-800">
                <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
                    <header className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-900">Checklist de Upgrade</h1>
                        <p className="text-slate-600 mt-2">Preencha todos os campos obrigatórios (*) para concluir.</p>
                    </header>

                    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
                        {/* Seção 1: Dados do Analista */}
                        <fieldset className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                            <legend className="w-full text-xl font-semibold text-red-700 border-b-4 border-red-600 pb-3 mb-6">SEÇÃO 1 | Dados do Analista</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="analystName" className="block text-sm font-medium text-slate-700">Nome do Analista*</label>
                                    <input type="text" id="analystName" name="analystName" value={formData.analystName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" required />
                                </div>
                                <div>
                                    <label htmlFor="analystEmail" className="block text-sm font-medium text-slate-700">E-mail do Analista*</label>
                                    <input type="email" id="analystEmail" name="analystEmail" value={formData.analystEmail} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" required />
                                </div>
                            </div>
                            <div className="mt-6">
                                <RadioGroup name="analystConsent" value={formData.analystConsent} onChange={handleChange} options={[{value: 'sim', label: 'Sim'}, {value: 'nao', label: 'Não'}]} legend="Eu aceito que meus dados sensíveis utilizados nesse checklist serão armazenados nos servidores da Checklist Virtual e da Claro." />
                            </div>
                        </fieldset>

                        {/* Seção 2: Dados do Técnico */}
                        <fieldset className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                            <legend className="w-full text-xl font-semibold text-red-700 border-b-4 border-red-600 pb-3 mb-6">SEÇÃO 2 | Dados do Técnico</legend>
                            <div className="space-y-6">
                                <RadioGroup name="techConsent" value={formData.techConsent} onChange={handleChange} options={[{value: 'sim', label: 'Sim'}, {value: 'nao', label: 'Não'}]} legend="Eu aceito que meus dados sensíveis utilizados nesse checklist serão armazenados nos servidores da Checklist Virtual e da Claro." />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="techName" className="block text-sm font-medium text-slate-700">Nome do Técnico*</label>
                                        <input type="text" id="techName" name="techName" value={formData.techName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" required />
                                    </div>
                                    <div>
                                        <label htmlFor="techPhone" className="block text-sm font-medium text-slate-700">Telefone*</label>
                                        <input type="tel" id="techPhone" name="techPhone" value={formData.techPhone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" placeholder="(00) 00000-0000" required />
                                    </div>
                                    <div>
                                        <label htmlFor="techCpf" className="block text-sm font-medium text-slate-700">CPF*</label>
                                        <input type="text" id="techCpf" name="techCpf" value={formData.techCpf} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" placeholder="000.000.000-00" required />
                                    </div>
                                    <div>
                                        <label htmlFor="techSelfie" className="block text-sm font-medium text-slate-700">Tire uma selfie do seu rosto*</label>
                                        <input type="file" id="techSelfie" name="techSelfie" accept="image/*" capture="user" onChange={handleChange} className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" required />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="contractor" className="block text-sm font-medium text-slate-700">Empreiteira/Operadora*</label>
                                    <select id="contractor" name="contractor" value={formData.contractor} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" required>
                                        <option value="">Selecione uma opção</option>
                                        <option value="Global Hitss">Global Hitss</option>
                                        <option value="Claro/Telmex">Claro/Telmex</option>
                                        <option value="Delfia">Delfia</option>
                                        <option value="Outra">Outra</option>
                                    </select>
                                </div>
                                {formData.contractor === 'Outra' && (
                                    <div>
                                        <label htmlFor="otherContractor" className="block text-sm font-medium text-slate-700">Especifique a empreiteira*</label>
                                        <input type="text" id="otherContractor" name="otherContractor" value={formData.otherContractor} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" required />
                                    </div>
                                )}
                            </div>
                        </fieldset>

                        {/* Seção 3: Dados da Loja */}
                        <fieldset className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                            <legend className="w-full text-xl font-semibold text-red-700 border-b-4 border-red-600 pb-3 mb-6">SEÇÃO 3 | Dados da Loja</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="storeCode" className="block text-sm font-medium text-slate-700">Código da Loja*</label>
                                    <input type="text" id="storeCode" name="storeCode" value={formData.storeCode} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" required />
                                </div>
                                <div>
                                    <label htmlFor="storeManager" className="block text-sm font-medium text-slate-700">Responsável*</label>
                                    <input type="text" id="storeManager" name="storeManager" value={formData.storeManager} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" required />
                                </div>
                                <div>
                                    <label htmlFor="storePhone" className="block text-sm font-medium text-slate-700">Telefone*</label>
                                    <input type="tel" id="storePhone" name="storePhone" value={formData.storePhone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" placeholder="(00) 0000-0000" required />
                                </div>
                            </div>
                        </fieldset>

                        {/* Seção 4: Produto a ser instalado */}
                        <fieldset className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                            <legend className="w-full text-xl font-semibold text-red-700 border-b-4 border-red-600 pb-3 mb-6">SEÇÃO 4 | Produto a ser instalado</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="connectivityType" className="block text-sm font-medium text-slate-700">Tipo de Conectividade*</label>
                                    <select id="connectivityType" name="connectivityType" value={formData.connectivityType} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" required>
                                        <option value="">Selecione uma opção</option>
                                        <option value="BLC Claro 600Mbps">BLC Claro 600Mbps</option>
                                        <option value="BLD Claro 50Mbps">BLD Claro 50Mbps</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="designation" className="block text-sm font-medium text-slate-700">Designação*</label>
                                    <input type="text" id="designation" name="designation" value={formData.designation} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" required />
                                </div>
                                <div>
                                    <label htmlFor="speedTest" className="block text-sm font-medium text-slate-700">Velocidade do Speed Test (Mbps)*</label>
                                    <input type="number" id="speedTest" name="speedTest" value={formData.speedTest} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" required />
                                </div>
                                <div>
                                    <label htmlFor="speedTestPhoto" className="block text-sm font-medium text-slate-700">Foto do Speed Test*</label>
                                    <input type="file" id="speedTestPhoto" name="speedTestPhoto" accept="image/*" capture="environment" onChange={handleChange} className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" required />
                                </div>
                            </div>
                        </fieldset>

                        {/* Seção 5: Evidências */}
                        <fieldset className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                            <legend className="w-full text-xl font-semibold text-red-700 border-b-4 border-red-600 pb-3 mb-6">SEÇÃO 5 | Evidências</legend>
                            <div className="space-y-8">
                                <EvidenceItem question="O IP WAN no Meraki está na faixa correta?" name="ipWan" value={formData.ipWan} onChange={handleEvidenceChange} />
                                <EvidenceItem question="A VPN está fechada e há clientes conectados?" name="vpn" value={formData.vpn} onChange={handleEvidenceChange} />
                                <EvidenceItem question="Os APs estão conectados e os Mobshop funcionando?" name="aps" value={formData.aps} onChange={handleEvidenceChange} />
                                <EvidenceItem question="Todas as nomenclaturas estão corretas (network name, MX, MR, MS e MV)?" name="nomenclature" value={formData.nomenclature} onChange={handleEvidenceChange} />
                                <EvidenceItem question="O campo Notes foi atualizado com a nova designação?" name="notes" value={formData.notes} onChange={handleEvidenceChange} />
                            </div>
                        </fieldset>

                        {/* Seção 6: Validação e Assinatura */}
                        <fieldset className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                            <legend className="w-full text-xl font-semibold text-red-700 border-b-4 border-red-600 pb-3 mb-6">SEÇÃO 6 | Código de Validação</legend>
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="validationCode" className="block text-sm font-medium text-slate-700">Insira o código recebido e assine:*</label>
                                    <input type="text" id="validationCode" name="validationCode" value={formData.validationCode} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Assinatura - Técnico*</label>
                                    <SignatureCanvas onSign={handleSign} onClear={handleClearSign} hasSigned={isSignatureValid} />
                                    {!isSignatureValid && <p className="text-red-500 text-sm mt-1">A assinatura é obrigatória.</p>}
                                </div>
                            </div>
                        </fieldset>

                        <div className="flex justify-end pt-4">
                            <button type="submit" className="w-full md:w-auto bg-red-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-300">
                                Enviar Checklist
                            </button>
                        </div>
                    </form>
                </div>
                <Modal 
                    isOpen={modal.isOpen} 
                    title={modal.title} 
                    message={modal.message} 
                    onClose={() => setModal({ isOpen: false, title: '', message: '' })} 
                />
            </div>
        </>
    );