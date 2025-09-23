'use client'
import React, { useState, useEffect } from 'react';

type ViewType = 
    | 'level-1' 
    | 'level-2-paper' 
    | 'level-2-containers' 
    | 'level-2-other'
    | 'result-organic'
    | 'result-organic-soiled-paper'
    | 'result-dry-recyclable'
    | 'result-dry-non-recyclable'
    | 'result-ewaste'
    | 'result-hazardous'
    | 'result-hazardous-medical'
    | 'result-special-construction';

type ColorType = 'green' | 'cyan' | 'gray' | 'blue' | 'red' | 'orange';

type DustbinColorType = 
    | 'bg-green-500' 
    | 'bg-blue-500' 
    | 'bg-black' 
    | 'bg-red-500';

interface ColorClasses {
    bg: string;
    border: string;
    text: string;
    textSecondary: string;
}

interface ResultCardProps {
    id: string;
    color: ColorType;
    title: string;
    message: string;
    dustbinColor?: DustbinColorType;
    noBin?: boolean;
    tips?: string[];
    recyclingRate?: number;
    environmentalImpact?: string;
}

interface ClassificationHistory {
    id: string;
    item: string;
    result: string;
    timestamp: Date;
    binColor: string;
}

const WasteClassifier: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewType>('level-1');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [showHistory, setShowHistory] = useState<boolean>(false);
    const [showTips, setShowTips] = useState<boolean>(false);
    const [classificationHistory, setClassificationHistory] = useState<ClassificationHistory[]>([]);
    const [currentItem, setCurrentItem] = useState<string>('');

    useEffect(() => {
        const savedHistory = localStorage.getItem('wasteClassifier-history');
        if (savedHistory) setClassificationHistory(JSON.parse(savedHistory));
    }, []);

    useEffect(() => {
        localStorage.setItem('wasteClassifier-history', JSON.stringify(classificationHistory));
    }, [classificationHistory]);

    const startOver = (): void => {
        setCurrentView('level-1');
        setCurrentItem('');
    };

    const handleViewChange = (view: ViewType, itemDescription?: string): void => {
        setCurrentView(view);
        if (itemDescription) setCurrentItem(itemDescription);
    };

    const addToHistory = (item: string, result: string, binColor: string): void => {
        const newEntry: ClassificationHistory = {
            id: Date.now().toString(),
            item,
            result,
            timestamp: new Date(),
            binColor
        };
        setClassificationHistory(prev => [newEntry, ...prev.slice(0, 9)]); 
    };

    const clearHistory = (): void => {
        setClassificationHistory([]);
    };

    const quickSearchResults = [
        { term: 'plastic bottle', view: 'level-2-containers' as ViewType },
        { term: 'glass bottle', view: 'level-2-containers' as ViewType },
        { term: 'aluminum can', view: 'level-2-containers' as ViewType },
        { term: 'pizza box', view: 'level-2-paper' as ViewType },
        { term: 'newspaper', view: 'result-dry-recyclable' as ViewType },
        { term: 'cardboard', view: 'level-2-paper' as ViewType },
        { term: 'food waste', view: 'result-organic' as ViewType },
        { term: 'fruit peels', view: 'result-organic' as ViewType },
        { term: 'vegetable scraps', view: 'result-organic' as ViewType },
        { term: 'coffee grounds', view: 'result-organic' as ViewType },
        { term: 'tea bags', view: 'result-organic' as ViewType },
        { term: 'phone', view: 'result-ewaste' as ViewType },
        { term: 'laptop', view: 'result-ewaste' as ViewType },
        { term: 'television', view: 'result-ewaste' as ViewType },
        { term: 'computer', view: 'result-ewaste' as ViewType },
        { term: 'headphones', view: 'result-ewaste' as ViewType },
        { term: 'battery', view: 'result-hazardous' as ViewType },
        { term: 'paint', view: 'result-hazardous' as ViewType },
        { term: 'light bulb', view: 'result-hazardous' as ViewType },
        { term: 'motor oil', view: 'result-hazardous' as ViewType },
        { term: 'cleaning supplies', view: 'result-hazardous' as ViewType },
        { term: 'medicine', view: 'result-hazardous-medical' as ViewType },
        { term: 'syringes', view: 'result-hazardous-medical' as ViewType },
        { term: 'bandages', view: 'result-hazardous-medical' as ViewType },
        { term: 'fabric', view: 'result-dry-non-recyclable' as ViewType },
        { term: 'clothing', view: 'result-dry-non-recyclable' as ViewType },
        { term: 'shoes', view: 'result-dry-non-recyclable' as ViewType },
        { term: 'wood', view: 'result-dry-non-recyclable' as ViewType },
        { term: 'furniture', view: 'result-special-construction' as ViewType },
        { term: 'mattress', view: 'result-special-construction' as ViewType },
        { term: 'appliances', view: 'result-special-construction' as ViewType }
    ].filter(item => 
        searchTerm && item.term.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const buttonBaseClasses: string = "option-button p-4 rounded-lg font-semibold transition-all duration-200 ease-in-out hover:-translate-y-1 hover:scale-105 hover:shadow-lg";

    const renderContent = (): React.ReactNode => {
        const getProgress = (): number => {
            if (currentView === 'level-1') return 25;
            if (currentView.startsWith('level-2')) return 50;
            if (currentView.startsWith('result')) return 100;
            return 0;
        };

        const progress = getProgress();

        const ProgressBar = () => (
            <div className="mb-6">
                <div className="w-full h-2 rounded-full bg-gray-200">
                    <div 
                        className="h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-sm mt-2 text-gray-600">
                    Classification Progress: {progress}%
                </p>
            </div>
        );

        switch (currentView) {
            case 'level-1':
                return (
                    <div id="level-1" className="question-level">
                        <ProgressBar />
                        <h2 className="text-xl font-semibold mb-6 text-gray-700">
                            What is the primary nature of your item?
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <button 
                                onClick={() => handleViewChange('result-organic', 'Food/Garden Waste')} 
                                className={`${buttonBaseClasses} bg-green-500 text-white hover:bg-green-600`}
                                type="button"
                                aria-label="Classify as organic waste"
                            >
                                🍎 Food, Plants, Garden Waste
                            </button>
                            <button 
                                onClick={() => handleViewChange('level-2-paper', 'Paper/Cardboard')} 
                                className={`${buttonBaseClasses} bg-yellow-500 text-white hover:bg-yellow-600`}
                                type="button"
                                aria-label="Go to paper classification"
                            >
                                📄 Paper or Cardboard
                            </button>
                            <button 
                                onClick={() => handleViewChange('level-2-containers', 'Container')} 
                                className={`${buttonBaseClasses} bg-cyan-500 text-white hover:bg-cyan-600`}
                                type="button"
                                aria-label="Go to container classification"
                            >
                                🥤 Plastic, Glass, or Metal
                            </button>
                            <button 
                                onClick={() => handleViewChange('result-ewaste', 'Electronic Item')} 
                                className={`${buttonBaseClasses} bg-blue-600 text-white hover:bg-blue-700`}
                                type="button"
                                aria-label="Classify as electronic waste"
                            >
                                📱 Electronic Item
                            </button>
                            <button 
                                onClick={() => handleViewChange('level-2-other', 'Other Material')} 
                                className={`${buttonBaseClasses} bg-gray-500 text-white hover:bg-gray-600 col-span-1 sm:col-span-2 lg:col-span-3`}
                                type="button"
                                aria-label="Go to other materials classification"
                            >
                                🔧 Something Else / Mixed Materials
                            </button>
                        </div>
                    </div>
                );

            case 'level-2-paper':
                return (
                    <div id="level-2-paper" className="question-level">
                        <ProgressBar />
                        <button 
                            onClick={() => setCurrentView('level-1')}
                            className="mb-4 text-sm px-4 py-2 rounded-lg transition-colors bg-gray-200 hover:bg-gray-300 text-gray-700"
                        >
                            ← Back
                        </button>
                        <h2 className="text-xl font-semibold mb-6 text-gray-700">
                            Is the paper/cardboard clean?
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button 
                                onClick={() => {
                                    handleViewChange('result-dry-recyclable', 'Clean Paper');
                                    addToHistory('Clean Paper/Cardboard', 'Recyclable Waste', 'Blue');
                                }} 
                                className={`${buttonBaseClasses} bg-green-500 text-white hover:bg-green-600`}
                                type="button"
                                aria-label="Classify as recyclable paper"
                            >
                                ✅ Yes, clean and dry
                            </button>
                            <button 
                                onClick={() => {
                                    handleViewChange('result-organic-soiled-paper', 'Soiled Paper');
                                    addToHistory('Soiled Paper (e.g., pizza box)', 'Organic Waste', 'Green');
                                }} 
                                className={`${buttonBaseClasses} bg-yellow-600 text-white hover:bg-yellow-700`}
                                type="button"
                                aria-label="Classify as organic waste due to contamination"
                            >
                                🍕 No, it's greasy or has food on it
                            </button>
                        </div>
                    </div>
                );

            case 'level-2-containers':
                return (
                    <div id="level-2-containers" className="question-level">
                        <ProgressBar />
                        <button 
                            onClick={() => setCurrentView('level-1')}
                            className="mb-4 text-sm px-4 py-2 rounded-lg transition-colors bg-gray-200 hover:bg-gray-300 text-gray-700"
                        >
                            ← Back
                        </button>
                        <h2 className="text-xl font-semibold mb-6 text-gray-700">
                            Is the container clean and empty?
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button 
                                onClick={() => {
                                    handleViewChange('result-dry-recyclable', 'Clean Container');
                                    addToHistory('Clean Container', 'Recyclable Waste', 'Blue');
                                }} 
                                className={`${buttonBaseClasses} bg-green-500 text-white hover:bg-green-600`}
                                type="button"
                                aria-label="Classify as recyclable container"
                            >
                                ✅ Yes, clean and dry
                            </button>
                            <button 
                                onClick={() => {
                                    handleViewChange('result-dry-non-recyclable', 'Dirty Container');
                                    addToHistory('Dirty Container', 'General Waste', 'Black');
                                }} 
                                className={`${buttonBaseClasses} bg-gray-500 text-white hover:bg-gray-600`}
                                type="button"
                                aria-label="Classify as non-recyclable due to contamination"
                            >
                                ❌ No, still has food/liquid
                            </button>
                        </div>
                    </div>
                );

            case 'level-2-other':
                return (
                    <div id="level-2-other" className="question-level">
                        <ProgressBar />
                        <button 
                            onClick={() => setCurrentView('level-1')}
                            className="mb-4 text-sm px-4 py-2 rounded-lg transition-colors bg-gray-200 hover:bg-gray-300 text-gray-700"
                        >
                            ← Back
                        </button>
                        <h2 className="text-xl font-semibold mb-6 text-gray-700">
                            What best describes this other item?
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button 
                                onClick={() => {
                                    handleViewChange('result-dry-non-recyclable', 'Fabric/Wood');
                                    addToHistory('Fabric/Textiles/Wood', 'General Waste', 'Black');
                                }} 
                                className={`${buttonBaseClasses} bg-purple-500 text-white hover:bg-purple-600`}
                                type="button"
                                aria-label="Classify as general waste"
                            >
                                🧥 Fabric, Textiles, or Wood
                            </button>
                            <button 
                                onClick={() => {
                                    handleViewChange('result-hazardous', 'Hazardous Material');
                                    addToHistory('Hazardous Material', 'Hazardous Waste', 'Red');
                                }} 
                                className={`${buttonBaseClasses} bg-red-500 text-white hover:bg-red-600`}
                                type="button"
                                aria-label="Classify as hazardous waste"
                            >
                                ⚠️ Chemicals, Paint, Batteries
                            </button>
                            <button 
                                onClick={() => {
                                    handleViewChange('result-hazardous-medical', 'Medical Waste');
                                    addToHistory('Medical Waste', 'Hazardous Waste', 'Red');
                                }} 
                                className={`${buttonBaseClasses} bg-red-500 text-white hover:bg-red-600`}
                                type="button"
                                aria-label="Classify as medical hazardous waste"
                            >
                                🏥 Medical Waste
                            </button>
                            <button 
                                onClick={() => {
                                    handleViewChange('result-special-construction', 'Construction Waste');
                                    addToHistory('Construction/Bulky Waste', 'Special Waste', 'Orange');
                                }} 
                                className={`${buttonBaseClasses} bg-orange-500 text-white hover:bg-orange-600 sm:col-span-2`}
                                type="button"
                                aria-label="Classify as special construction waste"
                            >
                                🏗️ Construction or Bulky Waste
                            </button>
                        </div>
                    </div>
                );

            case 'result-organic':
                return <ResultCard 
                    id="organic" 
                    color="green" 
                    title="Organic Waste" 
                    dustbinColor="bg-green-500" 
                    message="This compostable item goes in your **Green** bin." 
                    tips={[
                        "Composting reduces methane emissions",
                        "Creates nutrient-rich soil amendment",
                        "Remove any stickers or non-organic materials first"
                    ]}
                    recyclingRate={85}
                    environmentalImpact="Composting organic waste reduces landfill methane by 70%"
                />;
            
            case 'result-organic-soiled-paper':
                return <ResultCard 
                    id="organic-soiled-paper" 
                    color="green" 
                    title="Organic Waste" 
                    dustbinColor="bg-green-500" 
                    message="Soiled paper and pizza boxes can't be recycled, but they can be composted! Place it in your **Green** bin." 
                    tips={[
                        "Remove any plastic liners or non-compostable materials",
                        "Tear into smaller pieces to speed decomposition",
                        "Grease and food residue make it perfect for composting"
                    ]}
                    recyclingRate={0}
                    environmentalImpact="Composting soiled paper prevents contamination of recyclables"
                />;
            
            case 'result-dry-recyclable':
                return <ResultCard 
                    id="dry-recyclable" 
                    color="cyan" 
                    title="Recyclable Waste" 
                    dustbinColor="bg-blue-500" 
                    message="This item can be recycled. Place it in your **Blue** bin." 
                    tips={[
                        "Rinse containers before recycling",
                        "Remove caps and lids if different materials",
                        "Check local recycling guidelines for specifics"
                    ]}
                    recyclingRate={75}
                    environmentalImpact="Recycling saves 95% of energy compared to new production"
                />;

            case 'result-dry-non-recyclable':
                return <ResultCard 
                    id="dry-non-recyclable" 
                    color="gray" 
                    title="General Waste" 
                    dustbinColor="bg-black" 
                    message="This is not recyclable. Place it in your **Black** bin." 
                    tips={[
                        "Consider if the item can be donated or reused",
                        "Look for specialized recycling programs for textiles",
                        "Reduce future waste by choosing durable alternatives"
                    ]}
                    recyclingRate={5}
                    environmentalImpact="Minimizing general waste reduces landfill burden"
                />;

            case 'result-ewaste':
                return <ResultCard 
                    id="ewaste" 
                    color="blue" 
                    title="Electronic Waste (E-waste)" 
                    message="Requires special disposal. Find a designated e-waste collection point." 
                    noBin
                    tips={[
                        "Contains valuable metals that can be recovered",
                        "May contain hazardous materials if not properly disposed",
                        "Many retailers offer take-back programs",
                        "Wipe personal data before disposal"
                    ]}
                    recyclingRate={45}
                    environmentalImpact="Proper e-waste recycling recovers 95% of valuable materials"
                />;

            case 'result-hazardous':
                return <ResultCard 
                    id="hazardous" 
                    color="red" 
                    title="Hazardous Waste" 
                    dustbinColor="bg-red-500" 
                    message="This is dangerous. Place it in your **Red** bin or take it to a special facility." 
                    tips={[
                        "Never pour chemicals down drains",
                        "Keep in original containers when possible",
                        "Check for household hazardous waste collection events",
                        "Store safely until proper disposal"
                    ]}
                    recyclingRate={60}
                    environmentalImpact="Proper hazardous waste disposal prevents soil and water contamination"
                />;

            case 'result-hazardous-medical':
                return <ResultCard 
                    id="hazardous-medical" 
                    color="red" 
                    title="Medical Hazardous Waste" 
                    dustbinColor="bg-red-500" 
                    message="Medical waste is hazardous. Please use a designated **Red** bin or a sealed sharps container." 
                    tips={[
                        "Use puncture-proof containers for needles",
                        "Never throw loose needles in regular trash",
                        "Many pharmacies accept sharps containers",
                        "Follow local medical waste disposal guidelines"
                    ]}
                    recyclingRate={95}
                    environmentalImpact="Proper medical waste disposal protects public health and safety"
                />;

            case 'result-special-construction':
                return <ResultCard 
                    id="special-construction" 
                    color="orange" 
                    title="Special / Bulky Waste" 
                    message="This item requires special collection. Contact your local municipality for bulky waste pickup services." 
                    noBin
                    tips={[
                        "Schedule pickup in advance with waste management",
                        "Consider donation if item is still functional",
                        "Some materials may be recyclable at special facilities",
                        "Check for bulk item collection days in your area"
                    ]}
                    recyclingRate={35}
                    environmentalImpact="Proper bulky waste management enables material recovery and reuse"
                />;

            default:
                const _exhaustiveCheck: never = currentView;
                return null;
        }
    };

    const ResultCard: React.FC<ResultCardProps> = ({ 
        id, 
        color, 
        title, 
        message, 
        dustbinColor, 
        noBin = false,
        tips = [],
        recyclingRate,
        environmentalImpact
    }) => {
        const colorClasses: Record<ColorType, ColorClasses> = {
            green: {
                bg: 'bg-green-100',
                border: 'border-green-500',
                text: 'text-green-800',
                textSecondary: 'text-green-700'
            },
            cyan: {
                bg: 'bg-cyan-100',
                border: 'border-cyan-500',
                text: 'text-cyan-800',
                textSecondary: 'text-cyan-700'
            },
            gray: {
                bg: 'bg-gray-100',
                border: 'border-gray-500',
                text: 'text-gray-800',
                textSecondary: 'text-gray-700'
            },
            blue: {
                bg: 'bg-blue-100',
                border: 'border-blue-500',
                text: 'text-blue-800',
                textSecondary: 'text-blue-700'
            },
            red: {
                bg: 'bg-red-100',
                border: 'border-red-500',
                text: 'text-red-800',
                textSecondary: 'text-red-700'
            },
            orange: {
                bg: 'bg-orange-100',
                border: 'border-orange-500',
                text: 'text-orange-800',
                textSecondary: 'text-orange-700'
            }
        };

        const colors = colorClasses[color];

        const formatMessage = (text: string): string => {
            return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        };

        return (
            <div className={`result-card p-6 ${colors.bg} border-2 ${colors.border} rounded-lg transition-all duration-300`}>
                <h2 className={`text-2xl font-bold ${colors.text} flex items-center justify-center mb-4`}>
                    {title}
                    {!noBin && dustbinColor && (
                        <span 
                            className={`w-6 h-6 rounded-full inline-block ml-2.5 border-2 border-black/20 shadow ${dustbinColor}`}
                            aria-label="Dustbin color indicator"
                        />
                    )}
                </h2>
                
                <p 
                    className={`${colors.textSecondary} mb-4`} 
                    dangerouslySetInnerHTML={{ __html: formatMessage(message) }}
                />

                {recyclingRate !== undefined && (
                    <div className="mb-4">
                        <p className={`text-sm ${colors.textSecondary} mb-2`}>Recycling Rate</p>
                        <div className="w-full h-2 rounded-full bg-gray-300">
                            <div 
                                className="h-2 bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${recyclingRate}%` }}
                            />
                        </div>
                        <p className={`text-xs ${colors.textSecondary} mt-1`}>{recyclingRate}% recycling rate</p>
                    </div>
                )}

                {environmentalImpact && (
                    <div className="p-3 rounded-lg mb-4 bg-green-50">
                        <p className="text-sm font-medium text-green-800">
                            🌱 Environmental Impact
                        </p>
                        <p className="text-sm text-green-700">
                            {environmentalImpact}
                        </p>
                    </div>
                )}

                {tips.length > 0 && (
                    <div className="text-left">
                        <h3 className={`font-semibold ${colors.text} mb-2`}>💡 Helpful Tips:</h3>
                        <ul className={`text-sm ${colors.textSecondary} space-y-1`}>
                            {tips.map((tip, index) => (
                                <li key={index} className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="py-4 font-sans text-gray-800">
            <div className="w-full mx-auto">
                <div className="p-6 md:p-10 text-center">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                            🌍 Smart Waste Sorter
                        </h1>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="p-2 rounded-lg transition-colors bg-gray-200 hover:bg-gray-300 text-gray-600"
                                aria-label="Toggle history"
                            >
                                📋
                            </button>
                            <button
                                onClick={() => setShowTips(!showTips)}
                                className="p-2 rounded-lg transition-colors bg-gray-200 hover:bg-gray-300 text-gray-600"
                                aria-label="Toggle tips"
                            >
                                💡
                            </button>
                        </div>
                    </div>

                    <p className="mb-8 text-gray-500">
                        Let's find the right bin for your item and learn about environmental impact.
                    </p>

                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Quick search (e.g., 'plastic bottle', 'pizza box', 'phone', 'battery')..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-500"
                        />
                        {quickSearchResults.length > 0 && (
                            <div className="mt-2 p-2 rounded-lg bg-gray-50 max-h-48 overflow-y-auto">
                                {quickSearchResults.map((result, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            handleViewChange(result.view, result.term);
                                            setSearchTerm('');
                                        }}
                                        className="block w-full text-left p-2 rounded hover:bg-gray-200 transition-colors"
                                    >
                                        {result.term}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {showHistory && (
                        <div className="mb-6 p-4 rounded-lg bg-gray-50">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold">Recent Classifications</h3>
                                {classificationHistory.length > 0 && (
                                    <button
                                        onClick={clearHistory}
                                        className="text-red-500 text-sm hover:underline"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            {classificationHistory.length === 0 ? (
                                <p className="text-sm text-gray-600">
                                    No classifications yet. Start classifying items to see your history!
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {classificationHistory.map((entry) => (
                                        <div key={entry.id} className="text-sm p-2 rounded bg-white">
                                            <span className="font-medium">{entry.item}</span> → 
                                            <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                                entry.binColor === 'Green' ? 'bg-green-100 text-green-800' :
                                                entry.binColor === 'Blue' ? 'bg-blue-100 text-blue-800' :
                                                entry.binColor === 'Black' ? 'bg-gray-100 text-gray-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {entry.result}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {showTips && (
                        <div className="mb-6 p-4 rounded-lg bg-gray-50">
                            <h3 className="font-semibold mb-3">🌱 Waste Sorting Tips</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <h4 className="font-medium text-green-600 mb-2">♻️ General Tips</h4>
                                    <ul className="space-y-1">
                                        <li>• Clean containers before recycling</li>
                                        <li>• Remove caps and labels when possible</li>
                                        <li>• When in doubt, check local guidelines</li>
                                        <li>• Reduce and reuse before recycling</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-medium text-blue-600 mb-2">🌍 Environmental Impact</h4>
                                    <ul className="space-y-1">
                                        <li>• Recycling 1 ton of paper saves 17 trees</li>
                                        <li>• Composting reduces methane emissions</li>
                                        <li>• E-waste contains valuable recoverable metals</li>
                                        <li>• Proper disposal prevents soil contamination</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="content-container">
                        {renderContent()}
                    </div>
                    
                    <div className="mt-8 flex flex-wrap gap-4 justify-center">
                        {currentView !== 'level-1' && (
                            <button 
                                onClick={startOver} 
                                className="bg-indigo-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                                type="button"
                                aria-label="Start classification process over"
                            >
                                🔄 Classify Another Item
                            </button>
                        )}
                        
                        {currentView.startsWith('result-') && (
                            <button 
                                onClick={() => {
                                    const shareText = `I just classified "${currentItem}" using Smart Waste Sorter! 🌍 Let's all do our part for the environment. #WasteClassification #GoGreen`;
                                    if (navigator.share) {
                                        navigator.share({
                                            title: 'Smart Waste Sorter',
                                            text: shareText,
                                            url: window.location.href
                                        });
                                    } else {
                                        navigator.clipboard.writeText(shareText);
                                        alert('Share text copied to clipboard!');
                                    }
                                }}
                                className="bg-green-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                                type="button"
                                aria-label="Share classification result"
                            >
                                📤 Share Result
                            </button>
                        )}
                    </div>

                    {classificationHistory.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                            <p>
                                🎯 You've classified {classificationHistory.length} items! 
                                Keep up the great environmental work! 🌱
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .result-card, .question-level {
                    animation: fadeIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .option-button {
                    animation: buttonSlideIn 0.4s ease-out forwards;
                    opacity: 0;
                    transform: translateY(20px);
                }
                .option-button:nth-child(1) { animation-delay: 0.1s; }
                .option-button:nth-child(2) { animation-delay: 0.2s; }
                .option-button:nth-child(3) { animation-delay: 0.3s; }
                .option-button:nth-child(4) { animation-delay: 0.4s; }
                .option-button:nth-child(5) { animation-delay: 0.5s; }
                
                @keyframes buttonSlideIn {
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                /* Custom scrollbar for history */
                .overflow-y-auto::-webkit-scrollbar {
                    width: 4px;
                }
                .overflow-y-auto::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 2px;
                }
                .overflow-y-auto::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 2px;
                }
                .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
};

export default WasteClassifier;