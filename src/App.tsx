/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  FileText, 
  Download, 
  Settings, 
  Database, 
  AlertCircle, 
  ChevronRight, 
  Table, 
  Columns,
  RefreshCw,
  Info,
  Volume2,
  VolumeX,
  Globe,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserCheck,
  CheckCircle,
  Trash2,
  Bug
} from 'lucide-react';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CIVILIZATIONS, GALAXIES } from './constants';
import playerBasesIcon from './player-bases-icon.png';

function Autocomplete({
  value,
  placeholder,
  onChange,
  onSelectOption,
  options,
  id,
  icon
}: {
  value: string;
  placeholder: string;
  onChange: (val: string) => void;
  onSelectOption?: (val: string) => void;
  options: string[];
  id: string;
  icon: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const filteredOpts = useMemo(() => {
    const query = value.trim().toLowerCase();
    const optsWithAll = ['All', ...options.filter(o => o !== 'All')];
    if (!query || query === 'all') {
      return optsWithAll;
    }
    return optsWithAll.filter(opt => opt.toLowerCase().includes(query));
  }, [value, options]);

  return (
    <div ref={containerRef} className="relative group w-full">
      <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-[#FF0500] group-focus-within:text-[#FF0500] transition-colors">
        {icon}
      </div>
      <input
        id={id}
        type="text"
        value={value === 'All' ? '' : value}
        placeholder={placeholder}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        className="block w-full pl-14 pr-12 py-5 bg-[#141414] border-2 border-[#FF0500] rounded-full text-lg font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#FF0500] focus:border-[#FF0500] transition-all input-glow text-agt-orange shadow-[0_0_30px_rgba(255,5,0,0.05)] placeholder-agt-orange/40"
      />
      <AnimatePresence>
        {isOpen && filteredOpts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 w-full mt-2 max-h-60 overflow-y-auto bg-[#141414] border-2 border-[#FF0500] rounded-3xl shadow-[0_10px_40px_rgba(255,5,0,0.2)] scrollbar-thin scrollbar-thumb-red-600 overflow-x-hidden"
          >
            {filteredOpts.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onChange(opt);
                  if (onSelectOption) onSelectOption(opt);
                  setIsOpen(false);
                }}
                className="w-full text-left px-6 py-3.5 text-base font-mono font-medium text-[#FFB451] hover:bg-[#FF0500]/10 border-b border-[#FF0500]/10 last:border-0 transition-colors"
                id={`autocomplete-opt-${id}-${i}`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Column configuration mapping
interface ColumnConfig {
  name: string;
  enabled: boolean;
  rawIndex: number;
}

type ReportType = 'simple' | 'detailed' | 'custom';

interface CustomColumnDef {
  colNum: string;
  label: string;
  idxs: number[];
}

const CUSTOM_COLUMN_TOGGLES: CustomColumnDef[] = [
  { colNum: "1", label: "Base Name", idxs: [0] },
  { colNum: "2", label: "Planet", idxs: [1] },
  { colNum: "3", label: "System", idxs: [2] },
  { colNum: "4", label: "Region", idxs: [3] },
  { colNum: "5", label: "Galaxy", idxs: [4] },
  { colNum: "6", label: "Coordinates", idxs: [5] },
  { colNum: "7", label: "Glyph", idxs: [6] },
  { colNum: "8", label: "Civilized", idxs: [7] },
  { colNum: "9", label: "Builder", idxs: [8] },
  { colNum: "11", label: "YY", idxs: [10] },
  { colNum: "12", label: "XX", idxs: [11] },
  { colNum: "13", label: "Platform", idxs: [12] },
  { colNum: "14", label: "Mode", idxs: [13] },
  { colNum: "15", label: "Release", idxs: [14] },
  { colNum: "16", label: "Base Style", idxs: [15] },
  { colNum: "17", label: "Farm?", idxs: [16] },
  { colNum: "18", label: "Geobay?", idxs: [17] },
  { colNum: "19", label: "Arena?", idxs: [18] },
  { colNum: "20", label: "Landing Pad?", idxs: [19] },
  { colNum: "21", label: "Racetrack?", idxs: [20] },
  { colNum: "22", label: "Trade Terminal?", idxs: [21] },
  { colNum: "23-27", label: "POI", idxs: [22, 23, 24, 25, 26] },
  { colNum: "28", label: "Start Date", idxs: [27] },
  { colNum: "29", label: "Finish Date", idxs: [28] },
  { colNum: "30", label: "Survey Date", idxs: [29] },
  { colNum: "31", label: "Surveyor", idxs: [30] },
  { colNum: "32", label: "Summary Text", idxs: [31] },
  { colNum: "33", label: "Layout", idxs: [32] },
  { colNum: "34", label: "Notes", idxs: [33] },
  { colNum: "35", label: "Power", idxs: [34] },
  { colNum: "36", label: "Accessibility?", idxs: [35] },
  { colNum: "37", label: "Mining?", idxs: [36] },
  { colNum: "38", label: "Mine Capacity", idxs: [37] },
  { colNum: "39", label: "Gas?", idxs: [38] },
  { colNum: "40", label: "Gas Capacity", idxs: [39] },
  { colNum: "41-48", label: "Base Parts", idxs: [40, 41, 42, 43, 44, 45, 46, 47] },
  { colNum: "51", label: "Personal Notes", idxs: [50] },
  { colNum: "52", label: "Base Type", idxs: [51] },
  { colNum: "53", label: "Wiki Link", idxs: [52] },
  { colNum: "56-59", label: "URL Links", idxs: [55, 56, 57, 58] },
  { colNum: "60", label: "Deconstruction?", idxs: [59] }
];

const CUSTOM_COLUMN_ALL_INDICES = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15,
  16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, // 23-27 POI
  27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
  40, 41, 42, 43, 44, 45, 46, 47, // 41-48 Base Parts
  50, 51, 52,
  55, 56, 57, 58, // 56-59 URL Links
  59
];

const FALLBACK_HEADERS: Record<number, string> = {
  0: "Base Name", 1: "Planet Name", 2: "System Name", 3: "Region Name", 4: "Galaxy",
  5: "Coordinates", 6: "Glyphs", 7: "Civilization", 8: "Builder", 10: "PVP",
  11: "Attraction", 13: "Game Mode", 14: "Release", 15: "Base Style", 16: "Platform",
  51: "Base Type", 52: "Wiki Link", 55: "Economy Status", 56: "Conflict Level",
  57: "Hazards", 58: "Resources", 59: "Deconstruction"
};

const DICTIONARY: Record<string, Record<string, string>> = {
  en: {
    "AGT Base Report": "AGT Base Report",
    "AGT Base Report Tool": "AGT Base Report Tool",
    "All Bases": "All Bases",
    "Base Style": "Base Style",
    "Base Type": "Base Type",
    "Simple Report": "Simple Report",
    "Detailed Report": "Detailed Report",
    "Custom Report": "Custom Report",
    "Select Civilization": "Select Civilization",
    "Select Galaxy": "Select Galaxy",
    "Enter Region": "Enter Region",
    "Select Style": "Select Style",
    "Select Type": "Select Type",
    "Civilization Search...": "Civilization Search...",
    "Galaxy Search...": "Galaxy Search...",
    "Region Search...": "Region Search...",
    "All Styles": "All Styles",
    "All Types": "All Types",
    "Survey Date Filter:": "Survey Date Filter:",
    "Start:": "Start:",
    "End:": "End:",
    "Include Deconstructed Base Records?": "Include Deconstructed Base Records?",
    "No": "No",
    "Yes": "Yes",
    "Extract Records": "Extract Records",
    "Clear Filters": "Clear Filters",
    "Data Access in Process - Please Wait": "Data Access in Process - Please Wait",
    "Searching AGT Base Records": "Searching AGT Base Records",
    "Settings Console": "Settings Console",
    "Close": "Close",
    "Database Sync": "Database Sync",
    "Resync Database": "Resync Database",
    "Font Scaling": "Font Scaling",
    "default": "default",
    "Records Per Page": "Records Per Page",
    "AGT Anthem": "AGT Anthem",
    "Language Selection": "Language Selection",
    "Choose preferred interface language": "Choose preferred interface language",
    "Custom Report Columns": "Custom Report Columns",
    "Configure which columns appear in the Custom Report": "Configure which columns appear in the Custom Report",
    "STATUS:": "STATUS:",
    "SYNCING": "SYNCING",
    "CONNECTED": "CONNECTED",
    "DISCONNECTED": "DISCONNECTED",
    "AGT Galactic Archives Results": "AGT Galactic Archives Results",
    "FOUND": "FOUND",
    "PDF Report": "PDF Report",
    "Download CSV": "Download CSV",
    "alliance_of_galactic_travellers": "Alliance of Galactic Travellers",
    "Count:": "Count:",
    "Criteria 1": "Criteria 1",
    "Criteria 2": "Criteria 2",
    "Criteria 3": "Criteria 3",
    "Criteria 4": "Criteria 4",
    "Verified Galactic Ledger Matches": "Verified Galactic Ledger Matches"
  },
  fr: {
    "AGT Base Report": "Rapport de Base AGT",
    "AGT Base Report Tool": "Outil de Rapport de Base AGT",
    "All Bases": "Toutes les Bases",
    "Base Style": "Style de Base",
    "Base Type": "Type de Base",
    "Simple Report": "Rapport Simple",
    "Detailed Report": "Rapport Détaillé",
    "Custom Report": "Rapport Personnalisé",
    "Select Civilization": "Sélectionner la Civilisation",
    "Select Galaxy": "Sélectionner la Galaxie",
    "Enter Region": "Saisir la Région",
    "Select Style": "Sélectionner le Style",
    "Select Type": "Sélectionner le Type",
    "Civilization Search...": "Recherche de Civilisation...",
    "Galaxy Search...": "Recherche de Galaxie...",
    "Region Search...": "Recherche de Région...",
    "All Styles": "Tous les Styles",
    "All Types": "Tous les Types",
    "Survey Date Filter:": "Filtre de Date d'Enquête:",
    "Start:": "Début:",
    "End:": "Fin:",
    "Include Deconstructed Base Records?": "Inclure les bases déconstruites ?",
    "No": "Non",
    "Yes": "Oui",
    "Extract Records": "Extraire les Dossiers",
    "Clear Filters": "Effacer les Filtres",
    "Data Access in Process - Please Wait": "Accès aux Données en Cours - Veuillez Patienter",
    "Searching AGT Base Records": "Recherche des Dossiers de Base AGT",
    "Settings Console": "Console de Configuration",
    "Close": "Fermer",
    "Database Sync": "Synchro de base de données",
    "Resync Database": "Resynchroniser la Base de Données",
    "Font Scaling": "Taille de la Police",
    "default": "défaut",
    "Records Per Page": "Enregistrements Par Page",
    "AGT Anthem": "Hymne de l'AGT",
    "Language Selection": "Sélection de la Langue",
    "Choose preferred interface language": "Choisissez la langue de l'interface",
    "Custom Report Columns": "Colonnes du Rapport Personnalisé",
    "Configure which columns appear in the Custom Report": "Configurez les colonnes apparaissant dans le Rapport Personnalisé",
    "STATUS:": "STATUT :",
    "SYNCING": "SYNCHRONISATION",
    "CONNECTED": "CONNECTÉ",
    "DISCONNECTED": "DÉCONNECTÉ",
    "AGT Galactic Archives Results": "Résultats des Archives Galactiques AGT",
    "FOUND": "TROUVÉ",
    "PDF Report": "Rapport PDF",
    "Download CSV": "Télécharger le CSV",
    "alliance_of_galactic_travellers": "Alliance des Voyageurs Galactiques",
    "Count:": "Total :",
    "Criteria 1": "Critère 1",
    "Criteria 2": "Critère 2",
    "Criteria 3": "Critère 3",
    "Criteria 4": "Critère 4",
    "Verified Galactic Ledger Matches": "Correspondances de registre galactique vérifiées"
  },
  es: {
    "AGT Base Report": "Reporte de Base AGT",
    "AGT Base Report Tool": "Herramienta de Reportes Base AGT",
    "All Bases": "Todas las Bases",
    "Base Style": "Estilo de Base",
    "Base Type": "Tipo de Base",
    "Simple Report": "Reporte Simple",
    "Detailed Report": "Reporte Detallado",
    "Custom Report": "Reporte Personalizado",
    "Select Civilization": "Seleccionar Civilización",
    "Select Galaxy": "Seleccionar Galaxia",
    "Enter Region": "Ingresar Región",
    "Select Style": "Seleccionar Estilo",
    "Select Type": "Seleccionar Tipo",
    "Civilization Search...": "Buscar Civilización...",
    "Galaxy Search...": "Buscar Galaxia...",
    "Region Search...": "Buscar Región...",
    "All Styles": "Todos los Estilos",
    "All Types": "Todos los Tipos",
    "Survey Date Filter:": "Filtro de Fecha de Encuesta:",
    "Start:": "Inicio:",
    "End:": "Fin:",
    "Include Deconstructed Base Records?": "¿Incluir registros de bases deconstruidas?",
    "No": "No",
    "Yes": "Sí",
    "Extract Records": "Extraer Registros",
    "Clear Filters": "Limpiar Filtros",
    "Data Access in Process - Please Wait": "Acceso a Datos en Proceso - Por Favor Espere",
    "Searching AGT Base Records": "Buscando Registros Base AGT",
    "Settings Console": "Consola de Ajustes",
    "Close": "Cerrar",
    "Database Sync": "Sincronización de Base de Datos",
    "Resync Database": "Resincronizar Base de Datos",
    "Font Scaling": "Escalar Fuente",
    "default": "predeterminado",
    "Records Per Page": "Registros por Página",
    "AGT Anthem": "Himno AGT",
    "Language Selection": "Selección de Idioma",
    "Choose preferred interface language": "Elija el idioma de interfaz preferido",
    "Custom Report Columns": "Columnas de Reporte Personalizado",
    "Configure which columns appear in the Custom Report": "Configure qué columnas aparecen en el Reporte Personalizado",
    "STATUS:": "ESTADO:",
    "SYNCING": "SINCRONIZANDO",
    "CONNECTED": "CONECTADO",
    "DISCONNECTED": "DESCONECTADO",
    "AGT Galactic Archives Results": "Resultados de Archivos Galácticos AGT",
    "FOUND": "ENCONTRADOS",
    "PDF Report": "Reporte PDF",
    "Download CSV": "Descargar CSV",
    "alliance_of_galactic_travellers": "Alianza de Viajeros Galácticos",
    "Count:": "Total:",
    "Criteria 1": "Criterio 1",
    "Criteria 2": "Criterio 2",
    "Criteria 3": "Criterio 3",
    "Criteria 4": "Criterio 4",
    "Verified Galactic Ledger Matches": "Coincidencias de registro galáctico verificadas"
  },
  it: {
    "AGT Base Report": "Report Base AGT",
    "AGT Base Report Tool": "Strumento di Report Base AGT",
    "All Bases": "Tutte le Basi",
    "Base Style": "Stile Base",
    "Base Type": "Tipo Base",
    "Simple Report": "Report Semplice",
    "Detailed Report": "Report Dettagliato",
    "Custom Report": "Report Personalizzato",
    "Select Civilization": "Seleziona Civiltà",
    "Select Galaxy": "Seleziona Galassia",
    "Enter Region": "Inserisci Regione",
    "Select Style": "Seleziona Stile",
    "Select Type": "Seleziona Tipo",
    "Civilization Search...": "Cerca Civiltà...",
    "Galaxy Search...": "Cerca Galassia...",
    "Region Search...": "Cerca Regione...",
    "All Styles": "Tutti gli Stili",
    "All Types": "Tutti i Tipi",
    "Survey Date Filter:": "Filtro Data Rilievo:",
    "Start:": "Inizio:",
    "End:": "Fine:",
    "Include Deconstructed Base Records?": "Includere basi decostruite?",
    "No": "No",
    "Yes": "Sì",
    "Extract Records": "Estrai Record",
    "Clear Filters": "Cancella Filtri",
    "Data Access in Process - Please Wait": "Accesso ai Dati in Corso - Attendere",
    "Searching AGT Base Records": "Ricerca Registri Base AGT",
    "Settings Console": "Console Impostazioni",
    "Close": "Chiudi",
    "Database Sync": "Sincronizzazione Database",
    "Resync Database": "Risincronizza Database",
    "Font Scaling": "Scala Caratteri",
    "default": "predefinito",
    "Records Per Page": "Record Per Pagina",
    "AGT Anthem": "Inno AGT",
    "Language Selection": "Selezione Lingua",
    "Choose preferred interface language": "Scegli la lingua dell'interfaccia preferita",
    "Custom Report Columns": "Colonne del Report Personalizzato",
    "Configure which columns appear in the Custom Report": "Configura quali colonne appaiono nel Report Personalizzato",
    "STATUS:": "STATO:",
    "SYNCING": "SINCRONIZZAZIONE",
    "CONNECTED": "CONNESSO",
    "DISCONNECTED": "DISCONNESSO",
    "AGT Galactic Archives Results": "Risultati Archivi Galattici AGT",
    "FOUND": "TROVATI",
    "PDF Report": "Report PDF",
    "Download CSV": "Scarica CSV",
    "alliance_of_galactic_travellers": "Alleanza dei Viaggiatori Galattici",
    "Count:": "Totale:",
    "Criteria 1": "Criterio 1",
    "Criteria 2": "Criterio 2",
    "Criteria 3": "Criterio 3",
    "Criteria 4": "Criterio 4",
    "Verified Galactic Ledger Matches": "Corrispondenze registro galattico verificate"
  },
  de: {
    "AGT Base Report": "AGT-Basisbericht",
    "AGT Base Report Tool": "AGT-Basisberichtstool",
    "All Bases": "Alle Basen",
    "Base Style": "Basisstil",
    "Base Type": "Basistyp",
    "Simple Report": "Einfacher Bericht",
    "Detailed Report": "Detaillierter Bericht",
    "Custom Report": "Benutzerdefinierter Bericht",
    "Select Civilization": "Zivilisation auswählen",
    "Select Galaxy": "Galaxie auswählen",
    "Enter Region": "Region eingeben",
    "Select Style": "Stil auswählen",
    "Select Type": "Typ auswählen",
    "Civilization Search...": "Zivilisationssuche...",
    "Galaxy Search...": "Galaxiesuche...",
    "Region Search...": "Regionssuche...",
    "All Styles": "Alle Stile",
    "All Types": "Alle Typen",
    "Survey Date Filter:": "Vermessungsdatum-Filter:",
    "Start:": "Start:",
    "End:": "Ende:",
    "Include Deconstructed Base Records?": "Dekonstruierte Basen einschließen?",
    "No": "Nein",
    "Yes": "Ja",
    "Extract Records": "Datensätze extrahieren",
    "Clear Filters": "Filter löschen",
    "Data Access in Process - Please Wait": "Datenzugriff läuft - Bitte warten",
    "Searching AGT Base Records": "Suche in AGT-Basisdaten",
    "Settings Console": "Einstellungen-Konsole",
    "Close": "Schließen",
    "Database Sync": "Datenbank-Synchronisierung",
    "Resync Database": "Datenbank resynchronisieren",
    "Font Scaling": "Schriftskalierung",
    "default": "Standard",
    "Records Per Page": "Einträge pro Seite",
    "AGT Anthem": "AGT-Hymne",
    "Language Selection": "Sprachauswahl",
    "Choose preferred interface language": "Bevorzugte Benutzeroberflächensprache wählen",
    "Custom Report Columns": "Benutzerdefinierte Berichtsspalten",
    "Configure which columns appear in the Custom Report": "Konfigurieren Sie, welche Spalten im benutzerdefinierten Bericht angezeigt werden",
    "STATUS:": "STATUS:",
    "SYNCING": "SYNCHRONISIERUNG",
    "CONNECTED": "VERBUNDEN",
    "DISCONNECTED": "GETRENNT",
    "AGT Galactic Archives Results": "Ergebnisse des AGT-Galaxiearchivs",
    "FOUND": "GEFUNDEN",
    "PDF Report": "PDF-Bericht",
    "Download CSV": "CSV herunterladen",
    "alliance_of_galactic_travellers": "Allianz der galaktischen Reisenden",
    "Count:": "Gesamt:",
    "Criteria 1": "Kriterium 1",
    "Criteria 2": "Kriterium 2",
    "Criteria 3": "Kriterium 3",
    "Criteria 4": "Kriterium 4",
    "Verified Galactic Ledger Matches": "Verifizierte galaktische Ledger-Übereinstimmungen"
  },
  pt: {
    "AGT Base Report": "Relatório de Base AGT",
    "AGT Base Report Tool": "Ferramenta de Relatório de Base AGT",
    "All Bases": "Todas as Bases",
    "Base Style": "Estilo da Base",
    "Base Type": "Tipo de Base",
    "Simple Report": "Relatório Simples",
    "Detailed Report": "Relatório Detalhado",
    "Custom Report": "Relatório Personalizado",
    "Select Civilization": "Selecionar Civilização",
    "Select Galaxy": "Selecionar Galáxia",
    "Enter Region": "Inserir Região",
    "Select Style": "Selecionar Estilo",
    "Select Type": "Selecionar Tipo",
    "Civilization Search...": "Buscar Civilização...",
    "Galaxy Search...": "Buscar Galáxia...",
    "Region Search...": "Buscar Região...",
    "All Styles": "Todos os Estilos",
    "All Types": "Todos os Tipos",
    "Survey Date Filter:": "Filtro de Data de Pesquisa:",
    "Start:": "Início:",
    "End:": "Fim:",
    "Include Deconstructed Base Records?": "Incluir registros de bases desconstruídas?",
    "No": "Não",
    "Yes": "Sim",
    "Extract Records": "Extrair Registros",
    "Clear Filters": "Limpar Filtros",
    "Data Access in Process - Please Wait": "Acesso a Dados em Processamento - Por Favor, Aguarde",
    "Searching AGT Base Records": "Buscando Registros de Base AGT",
    "Settings Console": "Console de Configurações",
    "Close": "Fechar",
    "Database Sync": "Sincronização de Banco de Dados",
    "Resync Database": "Resincronizar Banco de Dados",
    "Font Scaling": "Ajuste de Fonte",
    "default": "padrão",
    "Records Per Page": "Registros por Página",
    "AGT Anthem": "Hino da AGT",
    "Language Selection": "Seleção de Idioma",
    "Choose preferred interface language": "Escolha o idioma de interface preferido",
    "Custom Report Columns": "Colunas do Relatório Personalizado",
    "Configure which columns appear in the Custom Report": "Configure quais colunas aparecem no Relatório Personalizado",
    "STATUS:": "STATUS:",
    "SYNCING": "SINCRONIZANDO",
    "CONNECTED": "CONECTADO",
    "DISCONNECTED": "DESCONECTADO",
    "AGT Galactic Archives Results": "Resultados dos Arquivos Galácticos AGT",
    "FOUND": "ENCONTRADOS",
    "PDF Report": "Relatório PDF",
    "Download CSV": "Baixar CSV",
    "alliance_of_galactic_travellers": "Aliança de Viajantes Galácticos",
    "Count:": "Total:",
    "Criteria 1": "Critério 1",
    "Criteria 2": "Critério 2",
    "Criteria 3": "Critério 3",
    "Criteria 4": "Critério 4",
    "Verified Galactic Ledger Matches": "Correspondências do Registro Galáctico Verificadas"
  },
  hi: {
    "AGT Base Report": "AGT बेस रिपोर्ट",
    "AGT Base Report Tool": "AGT बेस रिपोर्ट टูล",
    "All Bases": "सभी बेस",
    "Base Style": "बेस शैली",
    "Base Type": "बेस प्रकार",
    "Simple Report": "सरल रिपोर्ट",
    "Detailed Report": "विस्तृत रिपोर्ट",
    "Custom Report": "कस्टम रिपोर्ट",
    "Select Civilization": "सभ्यता चुनें",
    "Select Galaxy": "आकाशगंगा चुनें",
    "Enter Region": "क्षेत्र दर्ज करें",
    "Select Style": "शैली चुनें",
    "Select Type": "प्रकार चुनें",
    "Civilization Search...": "सभ्यता खोज...",
    "Galaxy Search...": "आकाशगंगा खोज...",
    "Region Search...": "क्षेत्र खोज...",
    "All Styles": "सभी शैलियां",
    "All Types": "सभी प्रकार",
    "Survey Date Filter:": "सर्वेक्षण तिथि फ़िल्टर:",
    "Start:": "प्रारंभ:",
    "End:": "समाप्त:",
    "Include Deconstructed Base Records?": "विघटित बेस रिकॉर्ड शामिल करें?",
    "No": "नहीं",
    "Yes": "हाँ",
    "Extract Records": "रिकॉर्ड निकालें",
    "Clear Filters": "फ़िल्टर साफ़ करें",
    "Data Access in Process - Please Wait": "डेटा एक्सेस जारी है - कृपया प्रतीक्षा करें",
    "Searching AGT Base Records": "AGT बेस रिकॉर्ड खोजे जा रहे हैं",
    "Settings Console": "सेटिंग्स कंसोल",
    "Close": "बंद करें",
    "Database Sync": "डेटाबेस सिंक",
    "Resync Database": "डेटाबेस सिंक करें",
    "Font Scaling": "फ़ॉन्ट स्केलिंग",
    "default": "डिफ़ॉल्ट",
    "Records Per Page": "प्रति पृष्ठ रिकॉर्ड",
    "AGT Anthem": "एजीटी गान",
    "Language Selection": "भाषा चयन",
    "Choose preferred interface language": "पसंदीदा इंटरफ़ेस भाषा चुनें",
    "Custom Report Columns": "कस्टम रिपोर्ट कॉलम",
    "Configure which columns appear in the Custom Report": "कस्टम रिपोर्ट में दिखाई देने वाले कॉलम कॉन्फ़िगर करें",
    "STATUS:": "स्थिति:",
    "SYNCING": "सिंक हो रहा है",
    "CONNECTED": "कनेक्टेड",
    "DISCONNECTED": "डिसकनेक्टेड",
    "AGT Galactic Archives Results": "एजीटी गैलेक्टिक अभिलेखागार परिणाम",
    "FOUND": "मिले",
    "PDF Report": "पीडीएफ रिपोर्ट",
    "Download CSV": "सीएसवी डाउनलोड करें",
    "alliance_of_galactic_travellers": "आकाशगंगा यात्रियों का गठबंधन",
    "Count:": "कुल संख्या:",
    "Criteria 1": "मापदंड 1",
    "Criteria 2": "मापदंड 2",
    "Criteria 3": "मापदंड 3",
    "Criteria 4": "मापदंड 4",
    "Verified Galactic Ledger Matches": "सत्यापित गैलेक्टिक बहीखाता मिलान"
  },
  zh: {
    "AGT Base Report": "AGT 基地报告",
    "AGT Base Report Tool": "AGT 基地报告工具",
    "All Bases": "所有基地",
    "Base Style": "基地样式",
    "Base Type": "基地类型",
    "Simple Report": "简要报告",
    "Detailed Report": "详细报告",
    "Custom Report": "自定义报告",
    "Select Civilization": "选择文明",
    "Select Galaxy": "选择星系",
    "Enter Region": "输入区域",
    "Select Style": "选择样式",
    "Select Type": "选择类型",
    "Civilization Search...": "文明搜索...",
    "Galaxy Search...": "星系搜索...",
    "Region Search...": "区域搜索...",
    "All Styles": "所有样式",
    "All Types": "所有类型",
    "Survey Date Filter:": "调查日期筛选:",
    "Start:": "开始:",
    "End:": "结束:",
    "Include Deconstructed Base Records?": "包含已拆除的基地记录吗？",
    "No": "否",
    "Yes": "是",
    "Extract Records": "提取记录",
    "Clear Filters": "清除筛选",
    "Data Access in Process - Please Wait": "数据访问中 - 请稍候",
    "Searching AGT Base Records": "正在搜索 AGT 基地记录",
    "Settings Console": "设置控制台",
    "Close": "关闭",
    "Database Sync": "数据库同步",
    "Resync Database": "重新同步数据库",
    "Font Scaling": "字体微调",
    "default": "默认",
    "Records Per Page": "每页记录",
    "AGT Anthem": "AGT 颂歌",
    "Language Selection": "语言选择",
    "Choose preferred interface language": "选择首选界面语言",
    "Custom Report Columns": "自定义报告列",
    "Configure which columns appear in the Custom Report": "配置自定义报告中显示的列",
    "STATUS:": "状态:",
    "SYNCING": "同步中",
    "CONNECTED": "已连接",
    "DISCONNECTED": "未连接",
    "AGT Galactic Archives Results": "AGT 星际档案馆结果",
    "FOUND": "找到",
    "PDF Report": "PDF 报告",
    "Download CSV": "下载 CSV",
    "alliance_of_galactic_travellers": "星际旅行者联盟",
    "Count:": "计数:",
    "Criteria 1": "条件 1",
    "Criteria 2": "条件 2",
    "Criteria 3": "条件 3",
    "Criteria 4": "条件 4",
    "Verified Galactic Ledger Matches": "已验证的银河分类帐匹配"
  },
  ja: {
    "AGT Base Report": "AGT 基地レポート",
    "AGT Base Report Tool": "AGT 基地レポートツール",
    "All Bases": "すべての基地",
    "Base Style": "基地スタイル",
    "Base Type": "基地タイプ",
    "Simple Report": "簡易レポート",
    "Detailed Report": "詳細レポート",
    "Custom Report": "カスタムレポート",
    "Select Civilization": "文明を選択",
    "Select Galaxy": "銀河を選択",
    "Enter Region": "領域を入力",
    "Select Style": "スタイルを選択",
    "Select Type": "タイプを選択",
    "Civilization Search...": "文明を検索...",
    "Galaxy Search...": "銀河を検索...",
    "Region Search...": "領域を検索...",
    "All Styles": "すべてのスタイル",
    "All Types": "すべてのタイプ",
    "Survey Date Filter:": "調査日フィルター:",
    "Start:": "開始:",
    "End:": "終了:",
    "Include Deconstructed Base Records?": "解体された基地の記録を含める？",
    "No": "いいえ",
    "Yes": "はい",
    "Extract Records": "レコード抽出",
    "Clear Filters": "フィルター解除",
    "Data Access in Process - Please Wait": "データ取得中 - しばらくお待ちください",
    "Searching AGT Base Records": "AGT 基地データを検索中",
    "Settings Console": "設定コンソール",
    "Close": "閉じる",
    "Database Sync": "データベース同期",
    "Resync Database": "データベースを再同期",
    "Font Scaling": "フォント調整",
    "default": "デフォルト",
    "Records Per Page": "ページあたりの行数",
    "AGT Anthem": "AGT 賛歌",
    "Language Selection": "言語設定",
    "Choose preferred interface language": "インターフェース表示言語を選択",
    "Custom Report Columns": "カスタムレポート表示項目",
    "Configure which columns appear in the Custom Report": "カスタムレポートに表示する列を構成します",
    "STATUS:": "ステータス:",
    "SYNCING": "同期中",
    "CONNECTED": "接続完了",
    "DISCONNECTED": "未接続",
    "AGT Galactic Archives Results": "AGT 銀河アーカイブ検索結果",
    "FOUND": "件見つかりました",
    "PDF Report": "PDFレポート",
    "Download CSV": "CSVダウンロード",
    "alliance_of_galactic_travellers": "銀河トラベラー同盟",
    "Count:": "カウント:",
    "Criteria 1": "条件 1",
    "Criteria 2": "条件 2",
    "Criteria 3": "条件 3",
    "Criteria 4": "条件 4",
    "Verified Galactic Ledger Matches": "検証済みの銀河元帳一致"
  },
  th: {
    "AGT Base Report": "รายงานฐานข้อมูล AGT",
    "AGT Base Report Tool": "เครื่องมือรายงานฐานข้อมูล AGT",
    "All Bases": "ฐานข้อมูลทั้งหมด",
    "Base Style": "สไตล์ฐานข้อมูล",
    "Base Type": "ประเภทฐานข้อมูล",
    "Simple Report": "รายงานแบบธรรมดา",
    "Detailed Report": "รายงานแบบละเอียด",
    "Custom Report": "รายงานแบบกำหนดเอง",
    "Select Civilization": "เลือกอารยธรรม",
    "Select Galaxy": "เลือกกาแล็กซี",
    "Enter Region": "กรอกภูมิภาค",
    "Select Style": "เลือกสไตล์",
    "Select Type": "เลือกประเภท",
    "Civilization Search...": "ค้นหาอารยธรรม...",
    "Galaxy Search...": "ค้นหากาแล็กซี...",
    "Region Search...": "ค้นหาภูมิภาค...",
    "All Styles": "สไตล์ทั้งหมด",
    "All Types": "ประเภททั้งหมด",
    "Survey Date Filter:": "ตัวกรองวันที่สำรวจ:",
    "Start:": "เริ่มต้น:",
    "End:": "สิ้นสุด:",
    "Include Deconstructed Base Records?": "รวมข้อมูลฐานที่ถูกรื้อถอนหรือไม่?",
    "No": "ไม่รวม",
    "Yes": "รวม",
    "Extract Records": "ดึงข้อมูลบันทึก",
    "Clear Filters": "ล้างตัวกรอง",
    "Data Access in Process - Please Wait": "กำลังดาวน์โหลดข้อมูล - โปรดรอสักครู่",
    "Searching AGT Base Records": "กำลังค้นหารายงานฐานข้อมูล AGT",
    "Settings Console": "แผงควบคุมการตั้งค่า",
    "Close": "ปิด",
    "Database Sync": "ซิงค์ฐานข้อมูล",
    "Resync Database": "ซิงค์ฐานข้อมูลใหม่",
    "Font Scaling": "ขนาดตัวอักษร",
    "default": "ค่าเริ่มต้น",
    "Records Per Page": "จำนวนรายการต่อหน้า",
    "AGT Anthem": "เพลงสรรเสริญ AGT",
    "Language Selection": "เลือกภาษา",
    "Choose preferred interface language": "เลือกภาษาของอินเทอร์เฟซที่ต้องการ",
    "Custom Report Columns": "คอลัมน์รายงานที่กำหนดเอง",
    "Configure which columns appear in the Custom Report": "ตั้งค่าคอลัมน์ที่จะให้แสดงในรายงานแบบกำหนดเอง",
    "STATUS:": "สถานะ:",
    "SYNCING": "กำลังซิงค์",
    "CONNECTED": "เชื่อมต่อแล้ว",
    "DISCONNECTED": "ตัดการเชื่อมต่อ",
    "AGT Galactic Archives Results": "ผลการค้นหาจากจดหมายเหตุอวกาศ AGT",
    "FOUND": "รายการที่พบ",
    "PDF Report": "รายงาน PDF",
    "Download CSV": "ดาวน์โหลด CSV",
    "alliance_of_galactic_travellers": "สมาคมนักสำรวจอวกาศ",
    "Count:": "จำนวนทั้งหมด:",
    "Criteria 1": "เกณฑ์ความต้องการ 1",
    "Criteria 2": "เกณฑ์ความต้องการ 2",
    "Criteria 3": "เกณฑ์ความต้องการ 3",
    "Criteria 4": "เกณฑ์ความต้องการ 4",
    "Verified Galactic Ledger Matches": "จับคู่แยกประเภทกาแล็กซีที่ตรวจสอบแล้ว"
  }
};

const CIV_ACRONYMS: Record<string, string> = {
  'Alliance of Galactic Travellers': 'AGT',
  'Intergalactic Travellers Foundation': 'IGTF',
  'Calypso Travellers Foundation': 'CTF',
  'Hyades Travellers Foundation': 'HTF',
  'Budullanger Travellers Foundation': 'BTF',
  'Budullangr Travellers Foundation': 'BTF',
  'Isdoraijung Travellers Foundation': 'ITF',
  'Kikolgallr Travellers Foundation': 'KTF',
  'Eissentam Travellers Foundation': 'ETF',
  'Ickjamatew Travellers Foundation': 'IJTF',
  'Rycempler Travellers Foundation': 'RTF',
  'Zavainlani Travellers Foundation': 'ZTF',
  'Animal Cracker Projects': 'ACP',
  'United Star Navy': 'USN',
  'CELAB Galactic Industries': 'CGI',
  'IVc Project': 'IVc',
  'AAAM Expeditionary': 'AAAM',
  'Riven Minerals and Exploration': 'RME',
  'Gravemind Expeditionary Force': 'GMEF'
};

type PlanetCategory = 'all' | 'style' | 'type';

const BASE_STYLES = [
  'Ground',
  'Aerial',
  'Upper Atmosphere',
  'Water surface',
  'Aquatic',
  'Cave',
  'Underground'
];

const BASE_TYPES = [
  'Artistic',
  'Civ HQ',
  'Company HQ',
  'Embassy',
  'Farm',
  'Industrial',
  'Military',
  'Memorial',
  'Monument',
  'Mixed Use',
  'Observatory',
  'Ordinary',
  'Portal Access',
  'Puzzle',
  'Race Track',
  'Residential',
  'Starter',
  'Trading'
];

const getDisplayValue = (val: any, colIdx?: number) => {
  const strVal = String(val || '').trim();
  if (colIdx === 7 && CIV_ACRONYMS[strVal]) {
    return CIV_ACRONYMS[strVal];
  }
  return strVal;
};

const isUrlColumn = (colIdx?: number, colName?: string, value?: any) => {
  if (colIdx !== undefined) {
    if (colIdx === 52 || colIdx === 55 || colIdx === 56 || colIdx === 57 || colIdx === 58) {
      return true;
    }
  }
  const nameLower = (colName || '').toLowerCase();
  if (nameLower.includes('wiki') || nameLower.includes('link') || nameLower.includes('url')) {
    return true;
  }
  const strVal = String(value || '').trim();
  if (strVal.startsWith('http://') || strVal.startsWith('https://')) {
    return true;
  }
  return false;
};

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop()?.split(';').shift() || '');
  }
  return null;
};

const decodeXOR = (encodedText: string): string => {
  const key = 969; 
  let decoded = ""; 
  for (let i = 0; i < encodedText.length; i++) { 
    let charCode = encodedText.charCodeAt(i); 
    let originalCharCode = charCode ^ key; // XOR again to reverse
    decoded += String.fromCharCode(originalCharCode); 
  } 
  return decoded; 
};

const getSecurityLevelNumber = (val: any): number => {
  if (val === undefined || val === null) return 0;
  const clean = String(val).trim().toLowerCase();
  if (clean === '') return 0;
  if (clean === '0' || clean === '1' || clean === '2' || clean === '3' || clean === '4' || clean === '5') {
    return parseInt(clean, 10);
  }
  const levels: Record<string, number> = {
    'public': 0,
    'private': 1,
    'restricted': 2,
    'top secret': 3,
    'slt restricted': 4,
    'scc restricted': 5
  };
  return levels[clean] !== undefined ? levels[clean] : 0;
};
const getSecurityLevelInfo = (level: number) => {
  switch (level) {
    case 0:
      return { text: "Public", rgb: "rgb(42, 255, 0)" };
    case 1:
      return { text: "Private", rgb: "rgb(0, 244, 255)" };
    case 2:
      return { text: "Restricted", rgb: "rgb(241, 152, 226)" };
    case 3:
      return { text: "Top Secret", rgb: "rgb(253, 3, 3)" };
    case 4:
      return { text: "SLT Restricted", rgb: "rgb(255, 147, 0)" };
    case 5:
      return { text: "SCC Restricted", rgb: "rgb(50, 135, 240)" };
    default:
      return { text: "Public", rgb: "rgb(42, 255, 0)" };
  }
};

const formatCacheDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

export default function App() {
  const [lang, setLang] = useState<string>(() => {
    return localStorage.getItem('agt_lang') || 'en';
  });

  const [customEnabledIndices, setCustomEnabledIndices] = useState<number[]>(() => {
    const saved = localStorage.getItem('agt_custom_cols');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [0, 1, 2, 3, 4, 5, 7, 8, 14, 15, 51, 52, 59];
  });

  const t = (key: string): string => {
    return DICTIONARY[lang]?.[key] || DICTIONARY['en']?.[key] || key;
  };

  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchedRecords, setMatchedRecords] = useState<any[]>([]);
  const [classifiedOmittedCount, setClassifiedOmittedCount] = useState<number>(0);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchKey, setSearchKey] = useState('');
  const [selectedGalaxy, setSelectedGalaxy] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedBuilderName, setSelectedBuilderName] = useState('All');

  const [reportType, setReportType] = useState<ReportType>('simple');
  const [logoSrc, setLogoSrc] = useState<string>('/AGTicon.png');
  const [planetCategory, setPlanetCategory] = useState<PlanetCategory>('all');
  const [selectedStyle, setSelectedStyle] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [includeDeconstructed, setIncludeDeconstructed] = useState<boolean>(false);
  const [securityOmitFilter, setSecurityOmitFilter] = useState<'all' | 'omit_public' | 'omit_classified'>('all');
  const [cachedDate, setCachedDate] = useState<string | null>(() => {
    return localStorage.getItem('agt_cached_csv_date');
  });
  const [isUsingCache, setIsUsingCache] = useState<boolean>(false);
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    const saved = localStorage.getItem('sheet_reporter_url');
    // We want to force upgrade anyone on a non-TSV or wrong GID url
    const correctUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0jFq80ut0o5jtApdhRG8sR2CIufVn0FNcugR_7fdCIfrDRfgB9s-SvEhBAePrQCibr1RcxFVoXj7o/pub?gid=1469408581&single=true&output=tsv';
    
    // Check if the saved URL is one of the old ones or doesn't have the correct current GID
    const isOld = !saved || 
                  saved.includes('gid=0') || 
                  saved.includes('gid=354119689') || 
                  saved.includes('gid=1524928332') ||
                  saved.includes('output=csv') ||
                  saved.includes('2PACX-1vSWiJE26JMTHgjGeZfpfTrwT1HL2ZnXIqiOVkNs-V8wtDkGE7ey0Q9hnAM-bpMhy475q45qHa09o2vC');

    if (isOld) return correctUrl;
    return saved;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isGeneratingFile, setIsGeneratingFile] = useState(false);

  // Traveller Name & ID Verification states
  const [travellerNameInput, setTravellerNameInput] = useState(() => getCookie('traveller_name') || '');
  const [travellerIdInput, setTravellerIdInput] = useState(() => getCookie('traveller_id') || '');
  const [verifiedName, setVerifiedName] = useState<string | null>(() => getCookie('traveller_name'));
  const [verifiedID, setVerifiedID] = useState<string | null>(() => getCookie('traveller_id'));
  const [securityLevel, setSecurityLevel] = useState<number>(() => {
    const cookieSec = getCookie('security_level');
    if (cookieSec !== null) {
      const parsed = Number(cookieSec);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0; // default Public
  });
  const [verificationError, setVerificationError] = useState<React.ReactNode | null>(null);
  const [verificationStateMsg, setVerificationStateMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [popupMsg, setPopupMsg] = useState<string | null>(null);

  const setCookie = (name: string, value: string, days = 365): boolean => {
    if (typeof document === 'undefined') return false;
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${encodeURIComponent(value)};path=/;expires=${expires.toUTCString()};SameSite=Lax`;
      const savedValue = getCookie(name);
      return savedValue === value;
    } catch (e) {
      return false;
    }
  };

  const deleteCookie = (name: string): boolean => {
    if (typeof document === 'undefined') return false;
    try {
      document.cookie = `${name}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 UTC;SameSite=Lax`;
      const val = getCookie(name);
      return val === null || val === '';
    } catch (e) {
      return false;
    }
  };

  const handleVerifyID = async () => {
    setVerificationError(null);
    setIsVerifying(true);

    try {
      const trimmedName = travellerNameInput.trim();
      const trimmedId = travellerIdInput.trim();

      if (!trimmedName) {
        setVerificationError("Traveller Name is required");
        setIsVerifying(false);
        setPopupMsg("Verification unsuccessful");
        alert("Verification unsuccessful");
        return;
      }

      if (trimmedName.length > 42) {
        setVerificationError("Traveller Name must be 42 characters or less");
        setIsVerifying(false);
        setPopupMsg("Verification unsuccessful");
        alert("Verification unsuccessful");
        return;
      }

      const isAlphanumeric = /^[a-zA-Z0-9 ]+$/.test(trimmedName);
      if (!isAlphanumeric) {
        setVerificationError("Traveller Name must be alphanumeric");
        setIsVerifying(false);
        setPopupMsg("Verification unsuccessful");
        alert("Verification unsuccessful");
        return;
      }

      if (!trimmedId) {
        setVerificationError("AGT Traveller ID is required");
        setIsVerifying(false);
        setPopupMsg("Verification unsuccessful");
        alert("Verification unsuccessful");
        return;
      }

      const idPattern = /^\d{8}-[0-9A-Za-z]{4}-\d{4}$/;
      if (!idPattern.test(trimmedId)) {
        setVerificationError("AGT Traveller ID must match format: ########-????-#### (e.g., 37411005-ABC9-1234)");
        setIsVerifying(false);
        setPopupMsg("Verification unsuccessful");
        alert("Verification unsuccessful");
        return;
      }

      const verifyUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSOZq3Cl2e0aNqzXdLRe63HuM7PlqGH3HnS_-0x6P_CYnGDJlK5QvI-YjU0lNaOgLyp3uoktS4WIXyK/pub?gid=505079663&single=true&output=tsv";
      const response = await fetch(verifyUrl);
      if (!response.ok) {
        throw new Error("Unable to reach verification service.");
      }
      
      const text = await response.text();
      Papa.parse(text, {
        header: false,
        skipEmptyLines: true,
        delimiter: '\t',
        complete: (results) => {
          const rows = results.data as string[][];
          
          const matchedRow = rows.find(r => {
            const colA = String(r[0] || '').trim();
            return colA.toLowerCase() === trimmedName.toLowerCase();
          });

          if (!matchedRow) {
            setVerificationError(
              <span>
                Traveller Name and ID and does not match, Please consult{" "}
                <a 
                  href="https://www.nms-agt.com/support/traveller-id" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#FF0500] hover:underline font-bold"
                >
                  AGT Support
                </a>
              </span>
            );
            setIsVerifying(false);
            setPopupMsg("Verification unsuccessful");
            alert("Verification unsuccessful");
            return;
          }

          const colBVal = String(matchedRow[1] || '').trim();
          const decodedB = decodeXOR(colBVal);

          const nameMatches = String(matchedRow[0] || '').trim().toLowerCase() === trimmedName.toLowerCase();
          const idMatches = decodedB.trim().toLowerCase() === trimmedId.toLowerCase();

          if (nameMatches && idMatches) {
            const colCVal = String(matchedRow[2] || '').trim();
            const secLevelNumber = getSecurityLevelNumber(colCVal);

            const sName = setCookie('traveller_name', matchedRow[0].trim());
            const sId = setCookie('traveller_id', trimmedId);
            const sLevel = setCookie('security_level', String(secLevelNumber));

            setVerifiedName(matchedRow[0].trim());
            setVerifiedID(trimmedId);
            setSecurityLevel(secLevelNumber);
            setVerificationError(null);
            setIsVerifying(false);

            findRecord(data, columns, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, secLevelNumber);

            if (sName && sId && sLevel) {
              setPopupMsg("Verification successful, setting saved");
              alert("Verification successful, setting saved");
            } else {
              setPopupMsg("Verification successful, setting save error");
              alert("Verification successful, setting save error");
            }
          } else {
            setVerificationError(
              <span>
                Traveller Name and ID and does not match, Please consult{" "}
                <a 
                  href="https://www.nms-agt.com/support/traveller-id" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#FF0500] hover:underline font-bold"
                >
                  AGT Support
                </a>
              </span>
            );
            setIsVerifying(false);
            setPopupMsg("Verification unsuccessful");
            alert("Verification unsuccessful");
          }
        },
        error: (err) => {
          throw err;
        }
      });
    } catch (err: any) {
      console.error(err);
      setVerificationError("Network verification error occurred. Please try again.");
      setIsVerifying(false);
      setPopupMsg("Verification unsuccessful");
      alert("Verification unsuccessful");
    }
  };

  const handleClearVerification = () => {
    const dName = deleteCookie('traveller_name');
    const dId = deleteCookie('traveller_id');
    const dLevel = deleteCookie('security_level');
    
    setTravellerNameInput('');
    setTravellerIdInput('');
    setVerifiedName(null);
    setVerifiedID(null);
    setSecurityLevel(0);
    setVerificationError(null);
    
    findRecord(data, columns, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 0);

    if (dName && dId && dLevel) {
      setPopupMsg("Clearing successful");
      alert("Clearing successful");
    } else {
      setPopupMsg("Clearing failed");
      alert("Clearing failed");
    }
  };
  
  // Background audio is muted by default (saved === 'true' only)
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('agt_audio_enabled');
    return saved === 'true';
  });
  
  // Font scaling factor state
  const [fontScale, setFontScale] = useState<string>(() => {
    return localStorage.getItem('agt_font_scale') || '1x';
  });

  // Survey range date states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Expandable panel state for custom report columns
  const [customColsExpanded, setCustomColsExpanded] = useState<boolean>(false);

  // Extract reports loading spinner overlay
  const [showExtractorSpinner, setShowExtractorSpinner] = useState(false);

  // Cache ref for sheet headers lookup
  const headersCache = useRef<string[]>([]);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // References and state for top dual horizontal scrollbar in results table
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [tableWidth, setTableWidth] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Apply Font Scaling Factor across the entire application
  useEffect(() => {
    let scalePct = '100%';
    if (fontScale === '1.25x') scalePct = '125%';
    else if (fontScale === '1.5x') scalePct = '150%';
    else if (fontScale === '2x') scalePct = '200%';
    else if (fontScale === '2.5x') scalePct = '250%';
    else if (fontScale === '3x') scalePct = '300%';
    document.documentElement.style.fontSize = scalePct;
    localStorage.setItem('agt_font_scale', fontScale);
  }, [fontScale]);

  // Dynamic predictive options retrieved from current data log entries
  const uniqueCivilizations = useMemo(() => {
    const s = new Set<string>(CIVILIZATIONS);
    data.forEach(row => {
      const v = String(row._raw?.[7] || '').trim();
      if (v && v.toLowerCase() !== 'null' && v.toLowerCase() !== '#n/a') {
        s.add(v);
      }
    });
    return Array.from(s).sort();
  }, [data]);

  const uniqueGalaxies = useMemo(() => {
    const s = new Set<string>(GALAXIES);
    data.forEach(row => {
      const v = String(row._raw?.[4] || '').trim();
      if (v && v.toLowerCase() !== 'null' && v.toLowerCase() !== '#n/a') {
        s.add(v);
      }
    });
    return Array.from(s).sort();
  }, [data]);

  const uniqueRegions = useMemo(() => {
    const s = new Set<string>();
    data.forEach(row => {
      const v = String(row._raw?.[3] || '').trim();
      if (v && v.toLowerCase() !== 'null' && v.toLowerCase() !== '#n/a') {
        s.add(v);
      }
    });
    return Array.from(s).sort();
  }, [data]);

  const uniqueBuilders = useMemo(() => {
    const s = new Set<string>();
    data.forEach(row => {
      const v = String(row._raw?.[8] || '').trim();
      if (v && v.toLowerCase() !== 'null' && v.toLowerCase() !== '#n/a' && v.toLowerCase() !== '-') {
        s.add(v);
      }
    });
    return Array.from(s).sort();
  }, [data]);

  // Initial fetch
  useEffect(() => {
    const cachedData = localStorage.getItem('agt_cached_csv');
    if (cachedData) {
      const isTsv = sheetUrl ? sheetUrl.includes('output=tsv') : false;
      setLoading(true);
      processCsvText(cachedData, isTsv);
      setIsUsingCache(true);
    } else if (sheetUrl) {
      fetchData();
    }
  }, []);

  // Background Audio Management
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (audioEnabled && audioRef.current) {
        audioRef.current.volume = 0.4;
        audioRef.current.play().catch(() => {});
      }
      window.removeEventListener('mousedown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('mousedown', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('mousedown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [audioEnabled]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.4;
      if (audioEnabled) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
    localStorage.setItem('agt_audio_enabled', String(audioEnabled));
  }, [audioEnabled]);

  const handleManualPlay = () => {
    if (audioEnabled && audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(() => {
    const saved = localStorage.getItem('agt_page_size');
    return saved ? parseInt(saved, 10) : 15;
  });



  // Save sheet URL to localStorage
  useEffect(() => {
    if (sheetUrl) {
      localStorage.setItem('sheet_reporter_url', sheetUrl);
    }
  }, [sheetUrl]);

  const processCsvText = (
    csvText: string, 
    isTsv: boolean, 
    overrides?: { 
      searchKey?: string; 
      galaxy?: string; 
      region?: string; 
      category?: PlanetCategory; 
      style?: string; 
      type?: string; 
      includeDeconstructed?: boolean;
      builder?: string;
    }
  ) => {
    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      delimiter: isTsv ? '\t' : undefined,
      complete: (results) => {
        const rawRows = results.data as string[][];
        if (rawRows.length < 2) {
          setError('The source sheet data is insufficient (need at least 2 rows).');
          setLoading(false);
          return;
        }

        const headers = rawRows[1]; // Row 2 is headers
        headersCache.current = headers;
        
        // Simple Columns: A, B, C, D, E, F, H, I, O, P, AZ, BA, BH (Indices: 0, 1, 2, 3, 4, 5, 7, 8, 14, 15, 51, 52, 59)
        const simpleIndices = [0, 1, 2, 3, 4, 5, 7, 8, 14, 15, 51, 52, 59];

        // Detailed Columns: A, B, C, D, E, F, G, H, I, K, L, N, O, P, all from Q to BA, BD, BE, BF, BG, BH (Indices: 0..8, 10, 11, 13, 14, 15, Q(16)..BA(52), 55, 56, 57, 58, 59)
        const detailedRangeQtoBA = Array.from({ length: 52 - 16 + 1 }, (_, i) => i + 16);
        const detailedIndices = [
          0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 13, 14, 15,
          ...detailedRangeQtoBA,
          55, 56, 57, 58, 59
        ];
        
        const targetIndexes = reportType === 'simple' ? simpleIndices : (reportType === 'detailed' ? detailedIndices : CUSTOM_COLUMN_ALL_INDICES);
        
        const filteredColumns = targetIndexes.map(idx => ({
          name: headers[idx] || `Col ${String.fromCharCode(65 + (idx % 26))}${idx >= 26 ? String.fromCharCode(65 + Math.floor(idx / 26) - 1) : ''}`,
          enabled: reportType === 'custom' ? customEnabledIndices.includes(idx) : true,
          rawIndex: idx
        }));
        
        setColumns(filteredColumns);
        
        const processedData = rawRows.slice(2) // Records start at Row 3 (index 2)
          .filter(row => {
            const colA = String(row[0] || '').trim();
            const colC = String(row[2] || '').trim();
            const colD = String(row[3] || '').trim();
            const colE = String(row[4] || '').trim();
            
            // Ignore any rows with a blank or null value in Column A.
            if (!colA || colA.toLowerCase() === 'null') return false;
            
            // Ignore any rows with SKIPROW in column A.
            if (colA.toUpperCase().includes('SKIPROW')) return false;
            
            // Ignore any rows with #N/A in column C, Column D, or Column E.
            if (
               colC.toUpperCase().includes('#N/A') || 
               colD.toUpperCase().includes('#N/A') || 
               colE.toUpperCase().includes('#N/A')
            ) return false;
            
            return true;
          })
          .map(row => {
            const rowObj: any = { _raw: row }; // Keep raw row for filtering
            targetIndexes.forEach((colIdx, listIdx) => {
              const headerName = filteredColumns[listIdx].name;
              rowObj[headerName] = row[colIdx] || '';
            });
            return rowObj;
          });
        
        setData(processedData);
        
        const currentS = overrides?.searchKey ?? searchKey;
        const currentG = overrides?.galaxy ?? selectedGalaxy;
        const currentR = overrides?.region ?? selectedRegion;
        const currentC = overrides?.category ?? planetCategory;
        const currentStyle = overrides?.style ?? selectedStyle;
        const currentType = overrides?.type ?? selectedType;
        const currentDeconstructed = overrides?.includeDeconstructed ?? includeDeconstructed;
        const currentBuilder = overrides?.builder ?? selectedBuilderName;

        findRecord(
          processedData, 
          filteredColumns, 
          currentS, 
          currentG, 
          currentR, 
          currentC, 
          currentStyle, 
          currentType, 
          currentDeconstructed,
          startDate,
          endDate,
          currentBuilder
        );
        setLoading(false);
      },
      error: (err: any) => {
        setError(`Parsing error: ${err.message}`);
        setLoading(false);
      }
    });
  };

  const fetchData = async (overrides?: { 
    searchKey?: string; 
    galaxy?: string; 
    region?: string; 
    category?: PlanetCategory; 
    style?: string; 
    type?: string; 
    includeDeconstructed?: boolean;
    builder?: string;
  }) => {
    if (!sheetUrl) {
      setError('Please provide a Google Sheet CSV URL in settings.');
      setShowSettings(true);
      return;
    }

    setLoading(true);
    setError(null);
    setMatchedRecords([]);

    try {
      // Handle the case where the user might paste a regular sheet URL instead of a pub link
      let fetchUrl = sheetUrl;
      if (sheetUrl.includes('docs.google.com/spreadsheets/') && !sheetUrl.includes('pub?')) {
        // Try to convert regular URL to CSV export if possible, 
        // though "Publish to Web" is the official way.
        if (sheetUrl.includes('/edit')) {
          fetchUrl = sheetUrl.replace(/\/edit.*$/, '/export?format=csv');
        }
      }

      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error('Failed to fetch sheet data. Is it published to the web?');
      
      const csvText = await response.text();
      
      // Save successfully synced data and timestamp to localStorage:
      localStorage.setItem('agt_cached_csv', csvText);
      const nowISO = new Date().toISOString();
      localStorage.setItem('agt_cached_csv_date', nowISO);
      setCachedDate(nowISO);
      setIsUsingCache(false);

      const isTsv = fetchUrl.includes('output=tsv');
      processCsvText(csvText, isTsv, overrides);

    } catch (err: any) {
      setError(err.message || 'Operation failed');
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setShowExtractorSpinner(true);
    setTimeout(() => {
      setShowExtractorSpinner(false);
      if (!data.length) {
        fetchData();
      } else {
        findRecord(data, columns);
      }
    }, 1500);
  };

  const findRecord = (
    sourceData: any[], 
    sourceCols: ColumnConfig[], 
    civTerm?: string, 
    galTerm?: string, 
    regTerm?: string, 
    catTerm?: PlanetCategory, 
    styleTerm?: string,
    typeTerm?: string,
    includeDeconstructedToggle?: boolean,
    surveyStart?: string,
    surveyEnd?: string,
    builderTerm?: string,
    overrideSecurityLevel?: number,
    overrideSecFilter?: 'all' | 'omit_public' | 'omit_classified'
  ) => {
    const rawCivTerm = (civTerm ?? searchKey).trim();
    const currentCivTerm = rawCivTerm.toLowerCase();
    const currentGalTerm = (galTerm ?? selectedGalaxy).trim().toLowerCase();
    const currentRegTerm = (regTerm ?? selectedRegion).trim().toLowerCase();
    const currentCatTerm = catTerm ?? planetCategory;
    const currentStyleTerm = (styleTerm ?? selectedStyle).trim().toLowerCase();
    const currentTypeTerm = (typeTerm ?? selectedType).trim().toLowerCase();
    const currentIncludeDeconstructed = includeDeconstructedToggle ?? includeDeconstructed;
    const sStart = surveyStart !== undefined ? surveyStart : startDate;
    const sEnd = surveyEnd !== undefined ? surveyEnd : endDate;
    const currentBuilderTerm = (builderTerm ?? selectedBuilderName).trim().toLowerCase();
    const currentSecFilter = overrideSecFilter ?? securityOmitFilter;
    
    let omittedCount = 0;

    if (
      (!currentCivTerm || currentCivTerm === 'all') && 
      currentGalTerm === 'all' && 
      currentRegTerm === 'all' && 
      currentCatTerm === 'all' && 
      currentStyleTerm === 'all' && 
      currentTypeTerm === 'all' && 
      (!currentBuilderTerm || currentBuilderTerm === 'all') &&
      currentIncludeDeconstructed && 
      !sStart &&
      !sEnd &&
      !sourceCols.length
    ) {
      setClassifiedOmittedCount(0);
      return;
    }

    // Matching columns:
    // Galaxy: Col E (index 4)
    // Region: Col D (index 3)
    // Civilization: Col H (index 7)
    
    const galaxyFieldName = sourceCols.find(c => c.rawIndex === 4)?.name;
    const regionFieldName = sourceCols.find(c => c.rawIndex === 3)?.name;
    const civFieldName = sourceCols.find(c => c.rawIndex === 7)?.name;

    const matches = sourceData.filter(row => {
      const rawRow = row._raw || [];
      
      // Civilization match
      const civVal = String(rawRow[7] || '').trim().toLowerCase();
      
      // Handle "All" selection
      let civMatch = currentCivTerm === 'all' || !currentCivTerm || currentCivTerm === '';

      if (!civMatch) {
        // Try matching the full term or any known acronyms
        const acronym = Object.entries(CIV_ACRONYMS).find(([full]) => full.toLowerCase() === currentCivTerm)?.[1]?.toLowerCase();
        
        // Permissive match:
        // 1. Direct inclusion of the search term
        // 2. Direct inclusion of the acronym
        // 3. Fallback: if search term contains "Foundation" or "Travellers", try matching parts
        civMatch = civVal.includes(currentCivTerm) || (acronym && civVal.includes(acronym));
        
        if (!civMatch && currentCivTerm.includes('traveller')) {
          // Handle 'Traveller' vs 'Traveler'
          const fuzzyTerm = currentCivTerm.replace(/traveller/g, 'traveler');
          civMatch = civVal.includes(fuzzyTerm);
        }
      }
      
      // Galaxy match (E)
      const galVal = String(rawRow[4] || '').toLowerCase();
      const galMatch = currentGalTerm === 'all' || currentGalTerm === '' || galVal.includes(currentGalTerm);
      
      // Region match (D)
      const regVal = String(rawRow[3] || '').toLowerCase().trim();
      const regMatch = currentRegTerm === 'all' || currentRegTerm === ''
        ? true
        : regVal.includes(currentRegTerm);
      
      // Base Style & Type category matching
      let categoryMatch = true;
      if (currentCatTerm === 'style') {
        const baseStyleVal = String(rawRow[15] || '').trim().toLowerCase();
        if (currentStyleTerm !== 'all' && currentStyleTerm !== '') {
          categoryMatch = baseStyleVal === currentStyleTerm;
        }
      } else if (currentCatTerm === 'type') {
        const baseTypeVal = String(rawRow[51] || '').trim().toLowerCase();
        if (currentTypeTerm !== 'all' && currentTypeTerm !== '') {
          categoryMatch = baseTypeVal === currentTypeTerm;
        }
      }

      // "Include Deconstructed Base Records?" Yes/No Toggle:
      // If selected as No (currentIncludeDeconstructed is false), then exclude base records which have "Y" in column BH (index 59).
      let deconstructedMatch = true;
      if (!currentIncludeDeconstructed) {
        const checkBHVal = String(rawRow[59] || '').trim().toUpperCase();
        if (checkBHVal === 'Y') {
          deconstructedMatch = false; // Exclude
        }
      }

      // Date of Survey match
      let dateMatch = true;
      if (headersCache.current && headersCache.current.length > 0) {
        const surveyDateIdx = headersCache.current.findIndex(h => h && h.trim().toLowerCase() === 'date of survey');
        if (surveyDateIdx !== -1) {
          const surveyDateVal = String(rawRow[surveyDateIdx] || '').trim();
          if (surveyDateVal) {
            const recordDate = new Date(surveyDateVal);
            if (!isNaN(recordDate.getTime())) {
              if (sStart) {
                const sDate = new Date(sStart);
                if (!isNaN(sDate.getTime()) && recordDate < sDate) {
                  dateMatch = false;
                }
              }
              if (sEnd) {
                const eDate = new Date(sEnd);
                if (!isNaN(eDate.getTime()) && recordDate > eDate) {
                  dateMatch = false;
                }
              }
            } else if (sStart || sEnd) {
              dateMatch = false;
            }
          } else if (sStart || sEnd) {
            dateMatch = false;
          }
        }
      }

      // Builder match (I)
      const builderVal = String(rawRow[8] || '').toLowerCase().trim();
      const builderMatch = currentBuilderTerm === 'all' || currentBuilderTerm === ''
        ? true
        : builderVal.includes(currentBuilderTerm);

      // Security level matching (Col BJ - column 62 - index 61 in rawRow)
      const recordSecVal = String(rawRow[61] || '').trim();
      const recordSecLevel = getSecurityLevelNumber(recordSecVal);
      
      let activeSecLevel = 0;
      if (overrideSecurityLevel !== undefined) {
        activeSecLevel = overrideSecurityLevel;
      } else if (verifiedName && verifiedID) {
        activeSecLevel = securityLevel;
      } else {
        activeSecLevel = 0;
      }
      
      let securityMatch = false;
      const isUserCleared = !!(verifiedName && verifiedID && securityLevel > 0);

      if (isUserCleared) {
        if (currentSecFilter === 'omit_public') {
          securityMatch = recordSecLevel > 0 && recordSecLevel <= activeSecLevel;
        } else if (currentSecFilter === 'omit_classified') {
          securityMatch = recordSecLevel === 0;
        } else {
          securityMatch = recordSecLevel <= activeSecLevel;
        }
      } else {
        securityMatch = recordSecLevel === 0;
      }

      const matchedAllOthers = !!(civMatch && galMatch && regMatch && categoryMatch && deconstructedMatch && dateMatch && builderMatch);

      if (matchedAllOthers && !securityMatch && recordSecLevel > 0) {
        omittedCount++;
      }

      return matchedAllOthers && securityMatch;
    });


    // Sort by Galaxy then Region then Name
    const sortedMatches = [...matches].sort((a, b) => {
      const rawA = a._raw || [];
      const rawB = b._raw || [];
      
      const galA = String(rawA[4] || '').toLowerCase();
      const galB = String(rawB[4] || '').toLowerCase();
      if (galA !== galB) return galA.localeCompare(galB);
      
      const regA = String(rawA[3] || '').toLowerCase();
      const regB = String(rawB[3] || '').toLowerCase();
      if (regA !== regB) return regA.localeCompare(regB);
      
      const systemA = String(rawA[2] || '').toLowerCase();
      const systemB = String(rawB[2] || '').toLowerCase();
      return systemA.localeCompare(systemB);
    });

    setClassifiedOmittedCount(omittedCount);

    if (sortedMatches.length > 0) {
      setMatchedRecords(sortedMatches);
      setCurrentPage(1);
      setError(null);
    } else {
      setMatchedRecords([]);
      setCurrentPage(1);
      setError(`No records found for the selected criteria.`);
    }
  };

  const sortedMatchedRecords = useMemo(() => {
    if (!sortColumn) {
      return matchedRecords;
    }
    
    // Find the column configuration
    const colConfig = columns.find(c => c.name === sortColumn);
    const colIdx = colConfig ? colConfig.rawIndex : undefined;

    return [...matchedRecords].sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];

      // Format display values for consistent natural comparison
      let dispA = getDisplayValue(valA, colIdx);
      let dispB = getDisplayValue(valB, colIdx);

      // Handle numbers comparison if both can be parsed as numbers
      const cleanA = dispA.replace(/,/g, '');
      const cleanB = dispB.replace(/,/g, '');
      const numA = Number(cleanA);
      const numB = Number(cleanB);
      let comparison = 0;

      if (!isNaN(numA) && !isNaN(numB) && cleanA !== '' && cleanB !== '') {
        comparison = numA - numB;
      } else {
        comparison = dispA.toLowerCase().localeCompare(dispB.toLowerCase());
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [matchedRecords, sortColumn, sortDirection, columns]);

  const handleSortColumn = (columnName: string) => {
    if (sortColumn === columnName) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnName);
      setSortDirection('asc');
    }
  };

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedMatchedRecords.slice(start, start + pageSize);
  }, [sortedMatchedRecords, currentPage, pageSize]);

  const totalPages = Math.ceil(matchedRecords.length / pageSize);

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    const radius = 2;
    const left = currentPage - radius;
    const right = currentPage + radius;

    pages.push(1);

    if (left > 2) {
      pages.push('...');
    }

    const start = Math.max(2, left);
    const end = Math.min(totalPages - 1, right);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    if (right < totalPages - 1) {
      pages.push('...');
    }

    pages.push(totalPages);

    return pages;
  };

  const downloadFullReportPdf = () => {
    if (!verifiedName || !verifiedID || securityLevel <= 0) {
      setPopupMsg("PDF Report and Download CSV are only available to Registered AGT Travellers. Check your log in details in the Settings menu.");
      return;
    }
    if (sortedMatchedRecords.length === 0) return;

    setIsGeneratingFile(true);

    setTimeout(() => {
      try {
        const activeCols = columns.filter(col => col.enabled);

        const totalUsableWidth = 277; // 297mm - 20mm margins

        const getTargetBodyLines = (colName: string, rawIndex: number) => {
          if (reportType === 'simple' || reportType === 'custom') {
            const nameLower = (colName || '').toLowerCase().trim();
            if (nameLower === 'coordinates' || rawIndex === 5) {
              return 1;
            }
            if (nameLower === 'builder' || rawIndex === 8) {
              return 1;
            }
            return 2;
          }
          return 2;
        };

        // Temporary document/text setup for exact font dimensions and line splitting
        const dummyDoc = new jsPDF('l', 'mm', 'a4');
        dummyDoc.setFont("Helvetica", "normal");
        dummyDoc.setFontSize(6.5);

        // Helper to calculate minimum width for a cell to wrap to at most targetLines (e.g. 2 lines)
        const getCellMinWidthForLines = (text: string, isHeader: boolean, targetLines = 2, cellPadding = 1.2, colName?: string, rawIndex?: number) => {
          const cleanText = text || '';
          dummyDoc.setFont("Helvetica", isHeader ? "bold" : "normal");
          dummyDoc.setFontSize(6.5);
          const textWidth = dummyDoc.getTextWidth(cleanText);
          const internalPadding = cellPadding * 2;
          
          const singleLineWidth = textWidth + internalPadding;
          
          const nameL = (colName || '').toLowerCase().trim();
          const isOneLineOnly = nameL === 'coordinates' || rawIndex === 5 || nameL === 'builder' || rawIndex === 8;
          
          const effTargetLines = isOneLineOnly ? 1 : targetLines;
          
          if (effTargetLines === 1) {
            return Math.max(8, singleLineWidth);
          }
          
          // To allow lines to break at Natural word breaks only, the column width must fit the longest word in that text.
          const words = cleanText.split(/\s+/).filter(w => w.length > 0);
          let longestWordWidth = 0;
          words.forEach(word => {
            const wWidth = dummyDoc.getTextWidth(word);
            if (wWidth > longestWordWidth) {
              longestWordWidth = wWidth;
            }
          });
          const minWordRequiredWidth = longestWordWidth + internalPadding;
          
          // Binary search for minimum required column width to fit content in <= effTargetLines
          let low = Math.max(8, minWordRequiredWidth);
          let high = Math.max(low, singleLineWidth);
          let best = high;
          
          while (low <= high) {
            const mid = (low + high) / 2;
            const maxTextWidth = mid - internalPadding;
            if (maxTextWidth <= 0) {
              low = mid + 0.1;
              continue;
            }
            const lines = dummyDoc.splitTextToSize(cleanText, maxTextWidth);
            if (lines.length <= effTargetLines) {
              best = mid;
              high = mid - 0.1;
            } else {
              low = mid + 0.1;
            }
          }
          return best;
        };

        const getIdealWidth = (text: string, isHeader: boolean, cellPadding = 1.2) => {
          const cleanText = text || '';
          dummyDoc.setFont("Helvetica", isHeader ? "bold" : "normal");
          dummyDoc.setFontSize(6.5);
          return Math.max(8, dummyDoc.getTextWidth(cleanText) + cellPadding * 2);
        };

        const tempUrlMap = new Map<string, string>();
        const tempTableData = sortedMatchedRecords.map((record, rIdx) => 
          activeCols.map((col, cIdx) => {
            const rawVal = record[col.name];
            const val = getDisplayValue(rawVal, col.rawIndex);
            
            if (isUrlColumn(col.rawIndex, col.name, rawVal)) {
              if (rawVal && String(rawVal).trim() !== '') {
                tempUrlMap.set(`${rIdx}-${cIdx}`, String(rawVal));
                return 'LINK';
              }
              return '-';
            }
            return val || '-';
          })
        );

        // Add total row to temporary table representation
        const countFieldName = columns[0]?.name;
        const tempTotalRow = activeCols.map(col => {
          if (col.name === countFieldName) return `Count: ${sortedMatchedRecords.length}`;
          return '';
        });
        tempTableData.push(tempTotalRow);

        // Calculate minimum required widths and ideal widths for all columns
        const minWidths = activeCols.map((col, cIdx) => {
          // Analyze header - allow URL columns to wrap up to 3 lines
          const targetHeaderLines = isUrlColumn(col.rawIndex, col.name) ? 3 : 2;
          let colMin = getCellMinWidthForLines(col.name, true, targetHeaderLines, 1.2, col.name, col.rawIndex);
          const targetBodyLines = getTargetBodyLines(col.name, col.rawIndex);
          // Analyze body rows + total row
          for (let rIdx = 0; rIdx < tempTableData.length; rIdx++) {
            const cellText = tempTableData[rIdx][cIdx];
            const cellMin = getCellMinWidthForLines(cellText, false, targetBodyLines, 1.2, col.name, col.rawIndex);
            if (cellMin > colMin) {
              colMin = cellMin;
            }
          }
          return colMin;
        });

        const idealWidths = activeCols.map((col, cIdx) => {
          const isUrl = isUrlColumn(col.rawIndex, col.name);
          // Analyze header - for URL columns, bound ideal width by min width
          let colIdeal = isUrl ? minWidths[cIdx] : getIdealWidth(col.name, true);
          // Analyze body rows + total row
          for (let rIdx = 0; rIdx < tempTableData.length; rIdx++) {
            const cellText = tempTableData[rIdx][cIdx];
            const cellIdeal = getIdealWidth(cellText, false);
            if (cellIdeal > colIdeal) {
              colIdeal = cellIdeal;
            }
          }
          return colIdeal;
        });

        const sumMinW = minWidths.reduce((sum, w) => sum + w, 0);

        // Custom report check for column limits
        if (sumMinW > totalUsableWidth) {
          if (reportType === 'custom') {
            setPdfError("Too many columns for PDF layout");
            setIsGeneratingFile(false);
            return; // Abort PDF generation!
          }
        }

        // Now calculate the actual column widths to minimize line wrapping
        const finalWidths: number[] = [];
        if (sumMinW > totalUsableWidth) {
          // Scale everything down to fit perfectly within totalUsableWidth (only for non-custom reports that exceed)
          const scale = totalUsableWidth / sumMinW;
          minWidths.forEach(w => {
            finalWidths.push(w * scale);
          });
        } else {
          // We have leftover space! Let's distribute it beautifully.
          const leftover = totalUsableWidth - sumMinW;
          let sumDiff = 0;
          const diffs = minWidths.map((w, idx) => {
            const d = Math.max(0, idealWidths[idx] - w);
            sumDiff += d;
            return d;
          });

          if (sumDiff > 0) {
            minWidths.forEach((w, idx) => {
              const extra = leftover * (diffs[idx] / sumDiff);
              finalWidths.push(w + extra);
            });
          } else {
            // If everything is already at single-line ideal width, distribute proportionally to minWidths
            minWidths.forEach(w => {
              const extra = leftover * (w / sumMinW);
              finalWidths.push(w + extra);
            });
          }
        }

        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for tables
        const displayId = searchKey || 'Bulk';
        
        // Draw logo helper for multiple pages
        const drawLogoOnDoc = (pdfDoc: any, x: number, y: number, w: number, h: number) => {
          try {
            const logoImg = document.querySelector('img[alt="AGT Logo"]') as HTMLImageElement;
            if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
              pdfDoc.addImage(logoImg, 'PNG', x, y, w, h, undefined, 'FAST');
            } else {
              const tempImg = new Image();
              tempImg.src = logoSrc;
              pdfDoc.addImage(tempImg, 'PNG', x, y, w, h, undefined, 'FAST');
            }
          } catch (err) {
            console.error('Failed to add logo image to PDF:', err);
          }
        };

        // 1. Cover Page
        // Calculate highest security level in sortedMatchedRecords
        let highestSecLevel = 0;
        sortedMatchedRecords.forEach(record => {
          const rawRow = record._raw || [];
          const recordSecVal = String(rawRow[61] || '').trim();
          const lvl = getSecurityLevelNumber(recordSecVal);
          if (lvl > highestSecLevel) {
            highestSecLevel = lvl;
          }
        });

        // Centered image about 20% from top of A4 Landscape (210mm height * 0.20 = 42mm)
        const coverLogoWidth = 32;
        const coverLogoHeight = 32;
        const coverCenterX = (doc.internal.pageSize.width - coverLogoWidth) / 2;
        drawLogoOnDoc(doc, coverCenterX, 38, coverLogoWidth, coverLogoHeight);

        // Put highest security level warning if any record has security level > 0
        if (highestSecLevel > 0) {
          const highestSecText = getSecurityLevelInfo(highestSecLevel).text;
          const warningY = (20 + 38) / 2; // 29mm - halfway between 20mm margin and 38mm logo logo
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(255, 0, 0); // Red
          doc.text(`This report contains ${highestSecText} AGT Intelligence.`, doc.internal.pageSize.width / 2, warningY, { align: "center" });
        }

        // Below it: Title "AGT Base Report" in hex color E25530
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(26);
        doc.setTextColor(226, 85, 48); // hex #E25530
        doc.text("AGT Base Report", doc.internal.pageSize.width / 2, 85, { align: "center" });

        // Header horizontal line in theme color #FF0500
        doc.setDrawColor(255, 5, 0);
        doc.setLineWidth(0.6);
        doc.line(30, 94, doc.internal.pageSize.width - 30, 94);

        // Below horizontal divider: Filter options
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        let coverY = 105;
        const coverLineHeight = 7;

        const civFilterVal = searchKey && searchKey !== 'All' ? searchKey : 'All';
        doc.text(`Civilization: ${civFilterVal}`, 50, coverY); coverY += coverLineHeight;
        doc.text(`Galaxy: ${selectedGalaxy || 'All'}`, 50, coverY); coverY += coverLineHeight;
        doc.text(`Region: ${selectedRegion || 'All'}`, 50, coverY); coverY += coverLineHeight;

        if (planetCategory === 'style' && selectedStyle !== 'All') {
          doc.text(`Base Style: ${selectedStyle}`, 50, coverY); coverY += coverLineHeight;
        } else if (planetCategory === 'type' && selectedType !== 'All') {
          doc.text(`Base Type: ${selectedType}`, 50, coverY); coverY += coverLineHeight;
        }

        const surveyRangeStr = startDate || endDate ? `${startDate || 'Open'} to ${endDate || 'Open'}` : 'All';
        doc.text(`Survey Date Range: ${surveyRangeStr}`, 50, coverY); coverY += coverLineHeight;
        doc.text(`Deconstructed base record included: ${includeDeconstructed ? 'yes' : 'no'}`, 50, coverY); coverY += coverLineHeight;

        // Report creation date line "Report Date:" <today's system date>
        doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 50, coverY);

        // Add page break to hold table data starting on Page 2
        doc.addPage();
        
        const urlMap = new Map<string, string>();
        
        const tableData = sortedMatchedRecords.map((record, rIdx) => 
          activeCols.map((col, cIdx) => {
            const rawVal = record[col.name];
            const val = getDisplayValue(rawVal, col.rawIndex);
            
            if (isUrlColumn(col.rawIndex, col.name, rawVal)) {
              if (rawVal && String(rawVal).trim() !== '') {
                urlMap.set(`${rIdx}-${cIdx}`, String(rawVal));
                return 'LINK';
              }
              return '-';
            }
            return val || '-';
          })
        );

        // Add total row to PDF
        const totalRow = activeCols.map(col => {
          if (col.name === countFieldName) return `Count: ${sortedMatchedRecords.length}`;
          return '';
        });
        tableData.push(totalRow);

        const colStyles: Record<number, { cellWidth: number }> = {};
        activeCols.forEach((col, idx) => {
          colStyles[idx] = { cellWidth: finalWidths[idx] };
        });

        autoTable(doc, {
          startY: 22,
          head: [activeCols.map(col => col.name)],
          body: tableData,
          theme: 'grid',
          styles: { cellPadding: 1.2, fontSize: 6.5, overflow: 'linebreak' },
          headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 6.5, fontStyle: 'bold' },
          bodyStyles: { fontSize: 6.5, textColor: [0, 0, 0], fillColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [255, 255, 255] },
          footStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 6.5 },
          margin: { top: 22, left: 10, right: 10, bottom: 16 },
          columnStyles: colStyles,
          didParseCell: (data) => {
            if (data.section === 'head') {
              data.cell.styles.textColor = [0, 0, 0];
            } else if (data.row.index === tableData.length - 1) {
              data.cell.styles.fillColor = [255, 255, 255];
              data.cell.styles.textColor = [0, 0, 0];
              data.cell.styles.fontStyle = 'bold';
            }
            
            const key = `${data.row.index}-${data.column.index}`;
            if (urlMap.has(key) && data.section !== 'head') {
              data.cell.styles.textColor = [0, 0, 255];
            }
          },
          didDrawCell: (data) => {
            const key = `${data.row.index}-${data.column.index}`;
            const url = urlMap.get(key);
            if (url && data.section === 'body') {
              doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url });
            }
          },
          didDrawPage: (data) => {
            const pageNum = doc.getNumberOfPages();
            if (pageNum === 1) return; // Skip cover page headers

            // Page Header
            drawLogoOnDoc(doc, 10, 6, 8, 8);
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(0, 0, 0);
            const headerText = `AGT Base Report - Civ: ${civFilterVal} / Galaxy: ${selectedGalaxy || 'All'} / Region: ${selectedRegion || 'All'}`;
            doc.text(headerText, 20, 11);
            doc.text(`Page ${pageNum - 1}`, doc.internal.pageSize.width - 10, 11, { align: 'right' });

            // Header divider line in hex color #FF0500
            doc.setDrawColor(255, 5, 0);
            doc.setLineWidth(0.3);
            doc.line(10, 16, doc.internal.pageSize.width - 10, 16);

            // Page Footer divider line in hex color #FF0500
            doc.line(10, doc.internal.pageSize.height - 12, doc.internal.pageSize.width - 10, doc.internal.pageSize.height - 12);

            // Footer Text
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(8);
            const leftFooterStr = `Survey Date Range: ${surveyRangeStr}`;
            doc.text(leftFooterStr, 10, doc.internal.pageSize.height - 7);

            const rightFooterStr = `Report Date: ${new Date().toLocaleDateString()}`;
            doc.text(rightFooterStr, doc.internal.pageSize.width - 10, doc.internal.pageSize.height - 7, { align: 'right' });

            if (highestSecLevel > 0) {
              doc.setTextColor(255, 0, 0);
              doc.setFont("Helvetica", "bold");
              doc.setFontSize(8.5);
              doc.text(getSecurityLevelInfo(highestSecLevel).text, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 7, { align: 'center' });
            }
          }
        });

        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        const reportLabel = reportType === 'simple' ? 'Simple' : (reportType === 'detailed' ? 'Detail' : 'Custom');
        doc.save(`AGT Base Report-${reportLabel}-${timestamp}.pdf`);
      } catch (err) {
        console.error("PDF generation failed:", err);
      } finally {
        setIsGeneratingFile(false);
      }
    }, 1800);
  };

  const downloadCsv = () => {
    if (!verifiedName || !verifiedID || securityLevel <= 0) {
      setPopupMsg("PDF Report and Download CSV are only available to Registered AGT Travellers. Check your log in details in the Settings menu.");
      return;
    }
    if (sortedMatchedRecords.length === 0) return;
    
    setIsGeneratingFile(true);
    
    setTimeout(() => {
      try {
        const activeCols = columns.filter(col => col.enabled);
        const csvData = sortedMatchedRecords.map(record => {
          const row: any = {};
          activeCols.forEach(col => {
            row[col.name] = getDisplayValue(record[col.name], col.rawIndex);
          });
          return row;
        });
        
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        const reportLabel = reportType === 'simple' ? 'Simple' : (reportType === 'detailed' ? 'Detail' : 'Custom');
        
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', `AGT Base Report-${reportLabel}-${timestamp}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (err) {
        console.error("CSV download failed:", err);
      } finally {
        setIsGeneratingFile(false);
      }
    }, 1500);
  };

  const toggleColumn = (name: string) => {
    setColumns(prev => prev.map(c => c.name === name ? { ...c, enabled: !c.enabled } : c));
  };

  const handleToggleIndices = (idxs: number[]) => {
    const allEnabled = idxs.every(idx => customEnabledIndices.includes(idx));
    let nextCustomIndices: number[];
    if (allEnabled) {
      nextCustomIndices = customEnabledIndices.filter(i => !idxs.includes(i));
    } else {
      const uniqueNew = idxs.filter(idx => !customEnabledIndices.includes(idx));
      nextCustomIndices = [...customEnabledIndices, ...uniqueNew];
    }
    setCustomEnabledIndices(nextCustomIndices);
    localStorage.setItem('agt_custom_cols', JSON.stringify(nextCustomIndices));

    if (reportType === 'custom') {
      const updatedCols = columns.map(col => {
        if (idxs.includes(col.rawIndex)) {
          return { ...col, enabled: !allEnabled };
        }
        return col;
      });
      setColumns(updatedCols);
      if (data.length) {
        findRecord(data, updatedCols);
      }
    }
  };

  const handleSelectAllCustomCols = () => {
    const allIdxs = Array.from(new Set(CUSTOM_COLUMN_TOGGLES.flatMap(item => item.idxs)));
    setCustomEnabledIndices(allIdxs);
    localStorage.setItem('agt_custom_cols', JSON.stringify(allIdxs));

    if (reportType === 'custom') {
      const updatedCols = columns.map(col => ({
        ...col,
        enabled: true
      }));
      setColumns(updatedCols);
      if (data.length) {
        findRecord(data, updatedCols);
      }
    }
  };

  const handleResetCustomCols = () => {
    setCustomEnabledIndices([]);
    localStorage.setItem('agt_custom_cols', JSON.stringify([]));

    if (reportType === 'custom') {
      const updatedCols = columns.map(col => ({
        ...col,
        enabled: false
      }));
      setColumns(updatedCols);
      if (data.length) {
        findRecord(data, updatedCols);
      }
    }
  };

  const activeColumnsCount = useMemo(() => columns.filter(c => c.enabled).length, [columns]);

  useEffect(() => {
    if (!tableRef.current) return;
    
    const observer = new ResizeObserver(() => {
      if (tableRef.current) {
        setTableWidth(tableRef.current.getBoundingClientRect().width);
      }
      if (bottomScrollRef.current) {
        setContainerWidth(bottomScrollRef.current.clientWidth);
      }
    });

    observer.observe(tableRef.current);
    if (bottomScrollRef.current) {
      observer.observe(bottomScrollRef.current);
    }
    
    // Initial width
    setTableWidth(tableRef.current.getBoundingClientRect().width);
    if (bottomScrollRef.current) {
      setContainerWidth(bottomScrollRef.current.clientWidth);
    }
    
    return () => {
      observer.disconnect();
    };
  }, [paginatedRecords, columns]);

  const handleTopScroll = () => {
    if (topScrollRef.current && bottomScrollRef.current) {
      if (Math.abs(bottomScrollRef.current.scrollLeft - topScrollRef.current.scrollLeft) > 1) {
        bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
      }
    }
  };

  const handleBottomScroll = () => {
    if (topScrollRef.current && bottomScrollRef.current) {
      if (Math.abs(topScrollRef.current.scrollLeft - bottomScrollRef.current.scrollLeft) > 1) {
        topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
      }
    }
  };

  const totalPoints = useMemo(() => {
    return matchedRecords.length;
  }, [matchedRecords]);

  return (
    <div 
      onMouseDown={handleManualPlay}
      onTouchStart={handleManualPlay}
      className="min-h-screen bg-[#0a0a0a] text-agt-orange font-sans selection:bg-agt-orange selection:text-black"
    >
      {isGeneratingFile && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
          <style>{`
            @keyframes spin-y-custom {
              0% { transform: rotateY(0deg); }
              100% { transform: rotateY(360deg); }
            }
            .animate-spin-y-custom {
              animation: spin-y-custom 2.2s linear infinite;
              transform-style: preserve-3d;
            }
          `}</style>
          <div className="flex flex-col items-center gap-6">
            <img 
              src={logoSrc} 
              alt="Rotating AGT Icon" 
              className="w-24 h-24 object-contain animate-spin-y-custom p-1"
              referrerPolicy="no-referrer"
            />
            <p className="text-[#FF0500] font-mono text-sm tracking-[0.2em] font-bold uppercase select-none text-center animate-pulse">
              Preparing AGT Data Packet
            </p>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="border-b border-agt-orange/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={logoSrc} 
              alt="AGT Logo" 
              className="w-10 h-10 object-contain opacity-90"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (logoSrc === "/AGTicon.png" || logoSrc === "/AGTIcon.png") {
                  setLogoSrc("/api/asset-proxy?id=1h9HvAGeru6Vo7PiWdLbXmGogD8TySnnz");
                } else {
                  img.style.display = 'none';
                  if (!img.parentElement?.querySelector('.agt-fallback')) {
                    img.parentElement?.insertAdjacentHTML('afterbegin', '<div class="agt-fallback w-10 h-10 border border-agt-orange rounded-sm flex items-center justify-center shrink-0"><span class="text-agt-orange font-bold text-[10px] tracking-tighter">AGT</span></div>');
                  }
                }
              }}
            />
            <div className="flex flex-col">
              <h1 className="font-bold text-xs tracking-[0.2em] uppercase text-agt-orange">{t('alliance_of_galactic_travellers')}</h1>
              <span className="text-[9px] text-agt-orange uppercase tracking-[0.3em] font-bold">{t('AGT Base Report Tool')}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end font-mono">
              {cachedDate ? (
                <>
                  <div className="text-[9px] text-agt-orange/30 tracking-widest uppercase">
                    {t('STATUS:')} <span className="text-blue-400 font-bold">Cached</span>
                  </div>
                  <div className="text-[8px] text-blue-400 font-mono tracking-wider mt-0.5 opacity-90 uppercase">
                    {formatCacheDate(cachedDate)}
                  </div>
                </>
              ) : (
                <div className="text-[9px] text-agt-orange/30 tracking-widest uppercase">
                  {t('STATUS:')} <span className={
                    loading ? 'text-yellow-500' :
                    sheetUrl ? 'text-emerald-500' : 
                    'text-red-500'
                  }>
                    {loading ? t('SYNCING') : sheetUrl ? t('CONNECTED') : t('DISCONNECTED')}
                  </span>
                </div>
              )}
            </div>
            
            <div 
              className="px-2.5 py-1 border rounded-lg font-mono text-[10px] md:text-sm font-bold whitespace-nowrap bg-black/45"
              style={{
                color: getSecurityLevelInfo(verifiedName && verifiedID ? securityLevel : 0).rgb,
                borderColor: getSecurityLevelInfo(verifiedName && verifiedID ? securityLevel : 0).rgb
              }}
            >
              {verifiedName && verifiedID ? verifiedName.slice(0, 12) : "Public User"}
            </div>

            <a
              href="https://www.nms-agt.com/support"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-transparent border-0 outline-none focus:outline-none cursor-pointer flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
              title="Support"
              id="support-bug-btn"
            >
              <Bug className="w-5 h-5 text-[#FF0500]" />
            </a>

            <motion.button 
              onClick={() => setShowSettings(true)}
              whileHover={{ rotate: 180 }}
              whileTap={{ scale: 0.9, rotate: 360 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="p-2 bg-transparent rounded-lg relative group focus:outline-none"
              title="Settings"
              id="settings-btn"
            >
              <Settings className="w-5 h-5 text-[#FF0500]" />
              {!sheetUrl && (
                <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#FF0500] rounded-full shadow-[0_0_5px_rgba(255,5,0,0.5)]"></span>
              )}
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Upper-right "Contribute" button, aligned right */}
        <div className="flex justify-end -mt-8 mb-6">
          <a
            href="https://www.nms-agt.com/contribute"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-1.5 border border-[#FF0500] bg-[#E25530] text-white hover:bg-[#E25530]/80 rounded-lg text-[8px] uppercase tracking-[0.15em] font-bold transition-all shadow-[0_2px_10px_rgba(255,5,0,0.1)] active:scale-[0.96] font-mono h-fit"
            id="contribute-btn"
          >
            {t('Contribute')}
          </a>
        </div>

        {/* player-bases-icon.png icon horizontally centered */}
        <div className="flex justify-center mb-6">
          <img 
            src={playerBasesIcon} 
            alt="Player Bases" 
            className="w-24 h-24 object-contain rounded-2xl border-2 border-[#FF0500] p-1 shadow-[0_0_20px_rgba(255,5,0,0.15)] bg-[#0c0c0c]"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex flex-col gap-16">
          
          {/* Main Search Logic Container - centered aesthetic */}
          <div className="flex flex-col items-center space-y-12">
            <div className="w-full max-w-xl text-center space-y-4">
              <h2 className="text-4xl font-light tracking-tight text-[#FFB451]">{t("AGT Base Report")}</h2>
              
              {/* Category selector */}
              <div className="flex flex-col sm:flex-row justify-center gap-3 mb-4 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto">
                {[
                  { id: 'all', label: t('All Bases') },
                  { id: 'style', label: t('Base Style') },
                  { id: 'type', label: t('Base Type') }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setPlanetCategory(cat.id as PlanetCategory);
                      if (data.length) {
                        findRecord(
                          data, 
                          columns, 
                          searchKey, 
                          selectedGalaxy, 
                          selectedRegion, 
                          cat.id as PlanetCategory,
                          selectedStyle,
                          selectedType,
                          includeDeconstructed
                        );
                      }
                    }}
                    className={`px-6 py-3 rounded-xl text-[9px] uppercase tracking-widest font-bold transition-all border-2 w-full sm:w-44 ${
                      planetCategory === cat.id 
                        ? 'bg-[#E25530] text-white border-[#FF0500] shadow-[0_0_15px_rgba(226,85,48,0.3)]' 
                        : 'text-agt-orange border-[#FF0500]/30 hover:bg-[#FF0500]/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Report Mode Selector */}
              <div className="flex justify-center mb-8">
                <div className="inline-flex p-1 bg-black/40 border-2 border-[#FF0500] rounded-xl flex-wrap sm:flex-nowrap gap-1">
                  <button
                    onClick={() => {
                      setReportType('simple');
                      setData([]);
                      setMatchedRecords([]);
                    }}
                    className={`px-6 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all ${
                      reportType === 'simple' 
                        ? 'bg-[#E25530] text-white' 
                        : 'text-agt-orange hover:bg-agt-orange/10'
                    }`}
                  >
                    {t('Simple Report')}
                  </button>
                  <button
                    onClick={() => {
                      setReportType('detailed');
                      setData([]);
                      setMatchedRecords([]);
                    }}
                    className={`px-6 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all ${
                      reportType === 'detailed' 
                        ? 'bg-[#E25530] text-white' 
                        : 'text-agt-orange hover:bg-agt-orange/10'
                    }`}
                  >
                    {t('Detailed Report')}
                  </button>
                  <button
                    onClick={() => {
                      setReportType('custom');
                      setData([]);
                      setMatchedRecords([]);
                    }}
                    className={`px-6 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all ${
                      reportType === 'custom' 
                        ? 'bg-[#E25530] text-white' 
                        : 'text-agt-orange hover:bg-agt-orange/10'
                    }`}
                  >
                    {t('Custom Report')}
                  </button>
                </div>
              </div>

            </div>

            <div className={`w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 ${planetCategory !== 'all' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-6`}>
              {/* Civilization Search */}
              <div className="flex flex-col w-full">
                <label className="block text-xs font-bold font-mono tracking-widest text-[#FFB451] uppercase mb-2 ml-1" htmlFor="civilization-select">
                  {t("Civilization")}
                </label>
                <Autocomplete
                  id="civilization-select"
                  value={searchKey}
                  placeholder={t("Civilization Search...")}
                  options={uniqueCivilizations}
                  icon={<Search className="h-5 w-5" />}
                  onChange={(val) => {
                    setSearchKey(val);
                    if (data.length) {
                      findRecord(data, columns, val, selectedGalaxy, selectedRegion, planetCategory, selectedStyle, selectedType, includeDeconstructed, undefined, undefined, selectedBuilderName);
                    } else {
                      fetchData({ searchKey: val });
                    }
                  }}
                />
              </div>

              {/* Galaxy Search */}
              <div className="flex flex-col w-full">
                <label className="block text-xs font-bold font-mono tracking-widest text-[#FFB451] uppercase mb-2 ml-1" htmlFor="galaxy-select">
                  {t("Galaxy")}
                </label>
                <Autocomplete
                  id="galaxy-select"
                  value={selectedGalaxy}
                  placeholder={t("Galaxy Search...")}
                  options={uniqueGalaxies}
                  icon={<Globe className="h-5 w-5" />}
                  onChange={(val) => {
                    setSelectedGalaxy(val);
                    if (data.length) {
                      findRecord(data, columns, searchKey, val, selectedRegion, planetCategory, selectedStyle, selectedType, includeDeconstructed, undefined, undefined, selectedBuilderName);
                    }
                  }}
                />
              </div>

              {/* Region Search */}
              <div className="flex flex-col w-full">
                <label className="block text-xs font-bold font-mono tracking-widest text-[#FFB451] uppercase mb-2 ml-1" htmlFor="region-select">
                  {t("Region")}
                </label>
                <Autocomplete
                  id="region-select"
                  value={selectedRegion}
                  placeholder={t("Region Search...")}
                  options={uniqueRegions}
                  icon={<Database className="h-5 w-5" />}
                  onChange={(val) => {
                    setSelectedRegion(val);
                    if (data.length) {
                      findRecord(data, columns, searchKey, selectedGalaxy, val, planetCategory, selectedStyle, selectedType, includeDeconstructed, undefined, undefined, selectedBuilderName);
                    }
                  }}
                />
              </div>

              {/* Builder Name Search */}
              <div className="flex flex-col w-full">
                <label className="block text-xs font-bold font-mono tracking-widest text-[#FFB451] uppercase mb-2 ml-1" htmlFor="builder-select">
                  {t("Builder Name")}
                </label>
                <Autocomplete
                  id="builder-select"
                  value={selectedBuilderName}
                  placeholder={t("Builder Name Search...")}
                  options={uniqueBuilders}
                  icon={<Search className="h-5 w-5" />}
                  onChange={(val) => {
                    setSelectedBuilderName(val);
                    if (data.length) {
                      findRecord(data, columns, searchKey, selectedGalaxy, selectedRegion, planetCategory, selectedStyle, selectedType, includeDeconstructed, undefined, undefined, val);
                    }
                  }}
                />
              </div>

              {/* Style Search - Only if category is style */}
              {planetCategory === 'style' && (
                <div className="flex flex-col w-full">
                  <div className="flex items-center gap-1.5 mb-2 ml-1">
                    <label className="text-xs font-bold font-mono tracking-widest text-[#FFB451] uppercase cursor-help" htmlFor="style-select">
                      {t("Base Style")}
                    </label>
                    <div className="relative group flex items-center">
                      <Info className="w-3.5 h-3.5 text-agt-orange/60 hover:text-agt-orange transition-colors" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#111111] border border-[#FF0500]/50 text-[#FFB451] text-[10px] font-mono leading-relaxed rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-center">
                        {t("Ground/ Aerial/ Upper Atmosphere/ Water surface/ Aquatic/ Cave/ Underground")}
                      </span>
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-[#FF0500] group-focus-within:text-[#FF0500] transition-colors">
                      <Table className="h-5 w-5" />
                    </div>
                    <select
                      value={selectedStyle}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedStyle(val);
                        if (data.length) {
                          findRecord(data, columns, searchKey, selectedGalaxy, selectedRegion, planetCategory, val, selectedType, includeDeconstructed, undefined, undefined, selectedBuilderName);
                        }
                      }}
                      className="block w-full pl-14 pr-12 py-5 bg-[#141414] border-2 border-[#FF0500] rounded-full text-lg font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#FF0500] focus:border-[#FF0500] transition-all input-glow text-[#FFB451] appearance-none shadow-[0_0_30px_rgba(255,5,0,0.05)]"
                      id="style-select"
                    >
                      <option value="All" className="bg-[#141414]">{t("All Styles")}</option>
                      {BASE_STYLES.map(style => (
                        <option key={style} value={style} className="bg-[#141414]">{style}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 inset-y-0 flex items-center pointer-events-none text-[#FF0500]">
                      <ChevronRight className="w-5 h-5 rotate-90" />
                    </div>
                  </div>
                </div>
              )}

              {/* Type Search - Only if category is type */}
              {planetCategory === 'type' && (
                <div className="flex flex-col w-full">
                  <div className="flex items-center gap-1.5 mb-2 ml-1">
                    <label className="text-xs font-bold font-mono tracking-widest text-[#FFB451] uppercase cursor-help" htmlFor="type-select">
                      {t("Base Type")}
                    </label>
                    <div className="relative group flex items-center">
                      <Info className="w-3.5 h-3.5 text-agt-orange/60 hover:text-agt-orange transition-colors" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#111111] border border-[#FF0500]/50 text-[#FFB451] text-[10px] font-mono leading-normal rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-center">
                        {t("Primary Base Purpose")}
                      </span>
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-[#FF0500] group-focus-within:text-[#FF0500] transition-colors">
                      <Table className="h-5 w-5" />
                    </div>
                    <select
                      value={selectedType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedType(val);
                        if (data.length) {
                          findRecord(data, columns, searchKey, selectedGalaxy, selectedRegion, planetCategory, selectedStyle, val, includeDeconstructed, undefined, undefined, selectedBuilderName);
                        }
                      }}
                      className="block w-full pl-14 pr-12 py-5 bg-[#141414] border-2 border-[#FF0500] rounded-full text-lg font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#FF0500] focus:border-[#FF0500] transition-all input-glow text-[#FFB451] appearance-none shadow-[0_0_30px_rgba(255,5,0,0.05)]"
                      id="type-select"
                    >
                      <option value="All" className="bg-[#141414]">{t("All Types")}</option>
                      {BASE_TYPES.map(type => (
                        <option key={type} value={type} className="bg-[#141414]">{type}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 inset-y-0 flex items-center pointer-events-none text-[#FF0500]">
                      <ChevronRight className="w-5 h-5 rotate-90" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Survey Date Range Filter Block */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-[#141414] border-2 border-[#FF0500] px-8 py-5 rounded-3xl backdrop-blur-sm shadow-[0_4px_20px_rgba(255,5,0,0.03)] w-full max-w-5xl justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#FF0500]" />
                <span className="text-[11px] md:text-sm uppercase tracking-[0.15em] font-bold text-[#FFB451] font-mono">
                  {t("Survey Date Filter:")}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-mono text-agt-orange">{t("Start:")}</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStartDate(val);
                      if (data.length) {
                        findRecord(data, columns, searchKey, selectedGalaxy, selectedRegion, planetCategory, selectedStyle, selectedType, includeDeconstructed, val, endDate);
                      }
                    }}
                    className="bg-[#1c1c1c] border-2 border-[#FF0500] rounded-xl px-4 py-2 font-mono text-xs text-agt-orange focus:outline-none focus:ring-1 focus:ring-[#FF0500]"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-mono text-agt-orange">{t("End:")}</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEndDate(val);
                      if (data.length) {
                        findRecord(data, columns, searchKey, selectedGalaxy, selectedRegion, planetCategory, selectedStyle, selectedType, includeDeconstructed, startDate, val);
                      }
                    }}
                    className="bg-[#1c1c1c] border-2 border-[#FF0500] rounded-xl px-4 py-2 font-mono text-xs text-[#FFB451] focus:outline-none focus:ring-1 focus:ring-[#FF0500]"
                  />
                </div>
              </div>
            </div>

            {/* Toggle switch for Include Deconstructed Base Records? */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/40 border-2 border-[#FF0500] px-8 py-4 rounded-3xl backdrop-blur-sm shadow-[0_4px_20px_rgba(255,5,0,0.03)] selection:bg-none">
              <span className="text-[11px] md:text-sm uppercase tracking-[0.15em] font-bold text-agt-orange font-mono">
                {t("Include Deconstructed Base Records?")}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIncludeDeconstructed(false);
                    if (data.length) {
                      findRecord(data, columns, searchKey, selectedGalaxy, selectedRegion, planetCategory, selectedStyle, selectedType, false);
                    }
                  }}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-mono font-black uppercase tracking-widest transition-all border ${
                    !includeDeconstructed
                      ? 'bg-[#E25530] text-white border-[#FF0500] font-extrabold shadow-[0_0_10px_rgba(255,5,0,0.4)]'
                      : 'text-agt-orange/60 hover:text-[#FFB451] hover:bg-[#FF0500]/10 border-transparent'
                  }`}
                  id="deconstructed-no"
                >
                  {t("No")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIncludeDeconstructed(true);
                    if (data.length) {
                      findRecord(data, columns, searchKey, selectedGalaxy, selectedRegion, planetCategory, selectedStyle, selectedType, true);
                    }
                  }}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-mono font-black uppercase tracking-widest transition-all border ${
                    includeDeconstructed
                      ? 'bg-[#E25530] text-white border-[#FF0500] font-extrabold shadow-[0_0_10px_rgba(255,5,0,0.4)]'
                      : 'text-agt-orange/60 hover:text-[#FFB451] hover:bg-[#FF0500]/10 border-transparent'
                  }`}
                  id="deconstructed-yes"
                >
                  {t("Yes")}
                </button>
              </div>
            </div>

            {verifiedName && verifiedID && securityLevel > 0 && (
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-black/40 border-2 border-[#FF0500] px-8 py-4 rounded-3xl backdrop-blur-sm shadow-[0_4px_20px_rgba(255,5,0,0.03)] selection:bg-none">
                <span className="text-[11px] md:text-sm uppercase tracking-[0.15em] font-bold text-agt-orange font-mono">
                  Security Controls:
                </span>
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-[#FFB451] hover:text-white" id="filter-omit-public-label">
                    <input
                      type="checkbox"
                      checked={securityOmitFilter === 'omit_public'}
                      onChange={() => {
                        setSecurityOmitFilter('omit_public');
                        if (data.length) {
                          findRecord(data, columns, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'omit_public');
                        }
                      }}
                      className="accent-[#FF0500] h-4 w-4 bg-[#1c1c1c] border-2 border-[#FF0500]/50 rounded text-[#FF0500] focus:ring-0 cursor-pointer"
                      id="filter-omit-public"
                    />
                    <span>Omit Public Records</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-[#FFB451] hover:text-white" id="filter-omit-classified-label">
                    <input
                      type="checkbox"
                      checked={securityOmitFilter === 'omit_classified'}
                      onChange={() => {
                        setSecurityOmitFilter('omit_classified');
                        if (data.length) {
                          findRecord(data, columns, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'omit_classified');
                        }
                      }}
                      className="accent-[#FF0500] h-4 w-4 bg-[#1c1c1c] border-2 border-[#FF0500]/50 rounded text-[#FF0500] focus:ring-0 cursor-pointer"
                      id="filter-omit-classified"
                    />
                    <span>Omit Classified Records</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-[#FFB451] hover:text-white" id="filter-all-label">
                    <input
                      type="checkbox"
                      checked={securityOmitFilter === 'all'}
                      onChange={() => {
                        setSecurityOmitFilter('all');
                        if (data.length) {
                          findRecord(data, columns, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'all');
                        }
                      }}
                      className="accent-[#FF0500] h-4 w-4 bg-[#1c1c1c] border-2 border-[#FF0500]/50 rounded text-[#FF0500] focus:ring-0 cursor-pointer"
                      id="filter-all"
                    />
                    <span>All Records</span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex flex-row items-center justify-center gap-4">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-14 py-5 border-2 border-[#FF0500] bg-[#E25530] text-white rounded-full font-black text-sm uppercase tracking-[0.2em] hover:bg-[#E25530]/80 active:scale-[0.96] disabled:opacity-25 disabled:pointer-events-none shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(255,5,0,0.4)] transition-all flex flex-row items-center gap-2"
                id="fetch-btn"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="text-[10px] tracking-[0.1em] mt-1">{t("Data Access in Process - Please Wait")}</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    <span>{t("Extract Records")}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearchKey('All');
                  setSelectedGalaxy('All');
                  setSelectedRegion('All');
                  setSelectedBuilderName('All');
                  setStartDate('');
                  setEndDate('');
                  setSelectedStyle('All');
                  setSelectedType('All');
                  setIncludeDeconstructed(false);
                  setSecurityOmitFilter('all');
                  if (data.length) {
                    findRecord(data, columns, 'All', 'All', 'All', planetCategory, 'All', 'All', false, '', '', 'All', undefined, 'all');
                  }
                }}
                className="px-8 py-5 border-2 border-[#FF0500] bg-[#E25530] text-white rounded-full font-black text-sm uppercase tracking-[0.2em] hover:bg-[#E25530]/80 active:scale-[0.96] transition-all"
                id="clear-btn"
              >
                {t("Clear Filters")}
              </button>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 px-6 py-3 bg-agt-orange/5 border border-agt-orange text-agt-orange rounded-full text-xs font-medium tracking-wide"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}
          </div>

          <div className="space-y-12">
            
            {/* Settings Area - POP-UP WINDOW BOX Overlay */}
            <AnimatePresence>
              {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="relative w-full max-w-sm max-h-[70vh] overflow-y-auto bg-[#141414] border-2 border-[#FF0500] rounded-3xl p-5 shadow-[0_0_50px_rgba(255,5,0,0.15)] font-mono text-agt-orange scrollbar-thin scrollbar-thumb-[#FF0500] scrollbar-track-[#141414] pr-4"
                  >
                    {/* Settings title and close */}
                    <div className="flex items-center justify-between border-b-2 border-[#FF0500] pb-4 mb-6">
                      <h2 className="text-lg font-bold uppercase tracking-widest text-[#FFFFB0] flex items-center gap-2 font-mono">
                        <Settings className="w-5 h-5 text-[#FF0500] animate-spin" style={{ animationDuration: '6s' }} />
                        {t("Settings Console")}
                      </h2>
                      <button
                        onClick={() => setShowSettings(false)}
                        className="px-4 py-1.5 border-2 border-[#FF0500] bg-[#E25530] text-white hover:bg-[#E25530]/80 rounded-full font-bold text-xs uppercase tracking-wider transition-all"
                      >
                        {t("Close")}
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Font Scaling & Records Per Page side-by-side dropdowns */}
                      <div className="grid grid-cols-2 gap-4 border-b-2 border-[#FF0500]/30 pb-5">
                        <div>
                          <label className="text-xs uppercase tracking-widest font-bold text-[#FFB451] mb-1.5 flex items-center gap-1.5 font-mono">
                            <Table className="w-3.5 h-3.5 text-[#FF0500]" />
                            {t("Font Scaling")}
                          </label>
                          <select
                            value={fontScale}
                            onChange={(e) => setFontScale(e.target.value)}
                            className="w-full bg-[#1c1c1c] border-2 border-[#FF0500]/30 rounded-xl px-2.5 py-2 text-xs text-agt-orange font-mono focus:outline-none focus:border-[#FF0500] transition-colors"
                          >
                            {['1x', '1.25x', '1.5x', '2x', '2.5x', '3x'].map(scale => (
                              <option key={scale} value={scale} className="bg-[#141414]">
                                {scale === '1x' ? '1x (default)' : scale}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs uppercase tracking-widest font-bold text-[#FFB451] mb-1.5 flex items-center gap-1.5 font-mono">
                            <Table className="w-3.5 h-3.5 text-[#FF0500]" />
                            {t("Records Per Page")}
                          </label>
                          <select
                            value={pageSize}
                            onChange={(e) => {
                              const size = Number(e.target.value);
                              setPageSize(size);
                              localStorage.setItem('agt_page_size', String(size));
                              setCurrentPage(1);
                            }}
                            className="w-full bg-[#1c1c1c] border-2 border-[#FF0500]/30 rounded-xl px-2.5 py-2 text-xs text-agt-orange font-mono focus:outline-none focus:border-[#FF0500] transition-colors"
                          >
                            {[15, 30, 50, 100].map(size => (
                              <option key={size} value={size} className="bg-[#141414]">
                                {size}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Traveller ID & Name Verification setting */}
                      <div className="border-b-2 border-[#FF0500]/30 pb-5 space-y-4">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-[#FFB451] flex items-center gap-1.5 font-mono">
                          <UserCheck className="w-3.5 h-3.5 text-[#FF0500]" />
                          AGT Traveller Registration
                        </h3>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider text-agt-orange/70 mb-1 font-mono">
                              Traveller Name (max 42 chars)
                            </label>
                            <input
                              type="text"
                              value={travellerNameInput}
                              onChange={(e) => {
                                let val = e.target.value;
                                if (val.length <= 42) {
                                  setTravellerNameInput(val);
                                }
                              }}
                              placeholder="e.g. Explorer Prime"
                              className="w-full bg-[#1c1c1c] border-2 border-[#FF0500]/30 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#FF0500] transition-colors placeholder-agt-orange/30"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase tracking-wider text-agt-orange/70 mb-1 font-mono">
                              AGT Traveller ID (########-????-####)
                            </label>
                            <input
                              type="text"
                              value={travellerIdInput}
                              onChange={(e) => setTravellerIdInput(e.target.value)}
                              placeholder="e.g. 37411005-ABC9-1234"
                              className="w-full bg-[#1c1c1c] border-2 border-[#FF0500]/30 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#FF0500] transition-colors placeholder-agt-orange/30"
                            />
                            {verifiedName && verifiedID && (
                              <div className="flex justify-end mt-2">
                                <div 
                                  className="px-3 py-1.5 border rounded-xl font-mono text-xs font-bold whitespace-nowrap bg-black/50"
                                  style={{ 
                                    color: getSecurityLevelInfo(securityLevel).rgb,
                                    borderColor: getSecurityLevelInfo(securityLevel).rgb
                                  }}
                                >
                                  {verifiedName}:{getSecurityLevelInfo(securityLevel).text}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 pt-1.5 font-mono">
                            <button
                              type="button"
                              onClick={handleVerifyID}
                              disabled={isVerifying}
                              className="flex-1 py-2 px-3 border-2 border-[#FF0500] bg-[#E25530] text-white hover:bg-[#E25530]/80 disabled:opacity-50 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                            >
                              {isVerifying ? (
                                <span className="animate-pulse">Verifying...</span>
                              ) : (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Verify & Save
                                </>
                              )}
                            </button>
                            
                            <button
                              type="button"
                              onClick={handleClearVerification}
                              className="py-2 px-3 border-2 border-[#FF0500]/50 bg-black text-[#FF0500] hover:bg-[#FF0500]/10 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                              title="Clear ID and Cookies"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Clear
                            </button>
                          </div>
                        </div>

                        {/* Verification Error message with hyperlink */}
                        {verificationError && (
                          <div className="p-2.5 bg-red-950/40 border border-[#FF0500]/50 rounded-xl text-[10px] text-white leading-normal font-mono">
                            {verificationError}
                          </div>
                        )}

                        {/* Verified Status indicators */}
                        {verifiedName && verifiedID && (
                          <div className="p-3 bg-green-950/20 border border-green-500/30 rounded-xl space-y-1 font-mono text-[10px] text-green-400">
                            <div className="font-bold uppercase tracking-wider flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                              VERIFIED TRAVELLER
                            </div>
                            <div>Name: <span className="text-white">{verifiedName}</span></div>
                            <div>ID: <span className="text-white">{verifiedID}</span></div>
                            <div>Clearance: <span className="text-white uppercase font-bold">
                              {securityLevel === 0 && "Public"}
                              {securityLevel === 1 && "Private"}
                              {securityLevel === 2 && "Restricted"}
                              {securityLevel === 3 && "Top Secret"}
                              {securityLevel === 4 && "SLT Restricted"}
                              {securityLevel === 5 && "SCC Restricted"}
                            </span></div>
                          </div>
                        )}
                      </div>

                      {/* Custom Report Column Settings Selector */}
                      <div className="border-b-2 border-[#FF0500]/30 pb-5">
                        <button
                          type="button"
                          onClick={() => setCustomColsExpanded(!customColsExpanded)}
                          className="w-full flex items-center justify-between text-xs uppercase tracking-widest font-bold text-[#FFB451] hover:text-[#E25530] transition-colors font-mono group py-1"
                        >
                          <span className="flex flex-col items-start gap-0.5 text-left">
                            <span className="flex items-center gap-1.5">
                              <Table className="w-4 h-4 text-[#FF0500]" />
                              {t("Custom Report Columns")}
                            </span>
                            <span className="text-[9px] text-[#FFB451]/50 normal-case font-normal font-sans ml-5.5">
                              {t("Configure which columns appear in the Custom Report")}
                            </span>
                          </span>
                          <ChevronRight 
                            className={`w-4 h-4 text-[#FF0500] transition-transform duration-300 ${
                              customColsExpanded ? "rotate-90" : ""
                            }`} 
                          />
                        </button>

                        <AnimatePresence initial={false}>
                          {customColsExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="overflow-hidden mt-3"
                            >
                              <div className="flex gap-2 mb-2.5">
                                <button
                                  type="button"
                                  onClick={handleSelectAllCustomCols}
                                  className="flex-1 py-1.5 bg-[#E25530]/15 hover:bg-[#E25530]/30 border border-[#FF0500]/50 text-white rounded-lg text-[9px] uppercase font-bold tracking-wider transition-all"
                                >
                                  {t("Select All")}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleResetCustomCols}
                                  className="flex-1 py-1.5 bg-[#1a1a1a] hover:bg-black/40 border border-[#FF0500]/25 text-[#FFB451]/70 hover:text-[#FFB451] rounded-lg text-[9px] uppercase font-bold tracking-wider transition-all"
                                >
                                  {t("Reset")}
                                </button>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1.5 bg-black/30 rounded-xl border border-[#FF0500]/20 scrollbar-thin scrollbar-thumb-[#E25530] scrollbar-track-transparent">
                                {CUSTOM_COLUMN_TOGGLES.map(item => {
                                  const isEnabled = item.idxs.every(idx => customEnabledIndices.includes(idx));
                                  
                                  return (
                                    <button
                                      key={item.colNum}
                                      type="button"
                                      onClick={() => handleToggleIndices(item.idxs)}
                                      className={`px-1 py-1 px-1.5 py-1 text-[8px] font-bold font-mono tracking-wide rounded border transition-all text-center truncate ${
                                        isEnabled
                                          ? 'bg-[#E25530] text-white border-[#FF0500] shadow-[0_0_4px_rgba(255,5,0,0.3)]'
                                          : 'bg-[#1a1a1a] text-[#FFB451]/50 border-[#FF0500]/20 hover:text-[#FFB451] hover:bg-[#FF0500]/10'
                                      }`}
                                    >
                                      {item.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Language Selection Selection block */}
                      <div className="border-b-2 border-[#FF0500]/30 pb-5 col-span-1">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-[#FFB451] mb-2 flex items-center gap-1.5 font-mono">
                          <Globe className="w-4 h-4 text-[#FF0500]" />
                          {t("Language Selection")}
                        </h3>
                        <select
                          value={lang}
                          onChange={(e) => {
                            const selectedLang = e.target.value;
                            setLang(selectedLang);
                            localStorage.setItem('agt_lang', selectedLang);
                          }}
                          className="w-full bg-[#1c1c1c] border-2 border-[#FF0500]/30 rounded-xl px-2.5 py-2 text-xs text-agt-orange font-mono focus:outline-none focus:border-[#FF0500] transition-colors"
                        >
                          <option value="en">English (default)</option>
                          <option value="fr">Français (French)</option>
                          <option value="es">Español (Spanish)</option>
                          <option value="it">Italiano (Italian)</option>
                          <option value="de">Deutsch (German)</option>
                          <option value="pt">Português (Portuguese (Brazilian))</option>
                          <option value="hi">हिन्दी (Hindi)</option>
                          <option value="zh">中文 (Mandarin Chinese)</option>
                          <option value="ja">日本語 (Japanese)</option>
                          <option value="th">ไทย (Thai)</option>
                        </select>
                      </div>

                      {/* AGT Anthem */}
                      <div className="flex items-center justify-between border-b-2 border-[#FF0500]/30 pb-5 pt-1">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-[#FFB451] flex items-center gap-1.5 font-mono">
                          <Volume2 className="w-4 h-4 text-[#FF0500]" />
                          {t("AGT Anthem")}
                        </h3>
                        <button 
                          onClick={() => setAudioEnabled(!audioEnabled)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all text-[10px] uppercase tracking-widest font-bold ${
                            audioEnabled 
                              ? 'bg-[#E25530] border-[#FF0500] text-white shadow-[0_0_10px_rgba(255,5,0,0.5)]' 
                              : 'bg-[#1c1c1c] border-[#FF0500]/30 text-agt-orange'
                          }`}
                        >
                          {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                          {audioEnabled ? t('Active') : t('Muted')}
                        </button>
                      </div>

                      {/* Database Sync */}
                      <div className="pt-1">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-[#FFB451] mb-2 flex items-center gap-2 font-mono">
                          <Database className="w-4 h-4 text-[#FF0500]" />
                          {t("Database Sync")}
                        </h3>
                        <button
                          onClick={() => {
                            localStorage.removeItem('agt_cached_csv');
                            localStorage.removeItem('agt_cached_csv_date');
                            setCachedDate(null);
                            setIsUsingCache(false);
                            fetchData();
                            setShowSettings(false);
                          }}
                          className="w-full py-2.5 bg-[#E25530] hover:bg-[#E25530]/80 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all border-2 border-[#FF0500]"
                        >
                          {t("Resync Database")}
                        </button>
                        {cachedDate && (
                          <div className="text-[10px] text-blue-400 font-mono text-center mt-2 tracking-wider">
                            {formatCacheDate(cachedDate)}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* PDF Error Pop-up Modal */}
            <AnimatePresence>
              {pdfError && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="relative w-full max-w-sm bg-[#141414] border-2 border-[#FF0500] rounded-3xl p-6 shadow-[0_0_50px_rgba(255,5,0,0.15)] font-mono text-agt-orange text-center"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#FF0500]/10 flex items-center justify-center border-2 border-[#FF0500]/30 text-[#FF0500]">
                        <AlertCircle className="w-6 h-6 animate-pulse" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#FFFFB0] font-mono">
                        {t("PDF Generation Aborted")}
                      </h3>
                      <p className="text-xs text-[#FFB451] leading-relaxed font-mono">
                        {t(pdfError)}
                      </p>
                      <button
                        onClick={() => {
                          setPdfError(null);
                          try {
                            alert(pdfError);
                          } catch (e) {}
                        }}
                        className="mt-2 px-6 py-2 border-2 border-[#FF0500] bg-[#E25530] text-white hover:bg-[#E25530]/80 rounded-full font-bold text-xs uppercase tracking-wider transition-all"
                      >
                        {t("OK")}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Results Section - Full Width for Table */}
            <div className="w-full">
              <AnimatePresence mode="wait">
                {matchedRecords.length > 0 ? (
                  <motion.section
                    key="results"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="glass-card border-2 border-[#FF0500] rounded-2xl overflow-hidden"
                  >
                    <div className="p-8 border-b-2 border-[#FF0500] flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-1">
                        <h3 className="text-xl font-medium text-agt-orange flex flex-wrap items-center gap-3">
                          AGT Galactic Archives Results
                          <span className="px-2 py-0.5 rounded-full bg-[#E25530] text-[10px] text-white border border-[#FF0500] font-mono">
                            {matchedRecords.length} FOUND
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[#E25530] text-[10px] text-white border border-[#FF0500] font-mono">
                            Classified Records Omitted: {classifiedOmittedCount}
                          </span>
                        </h3>
                        <p className="text-[10px] text-agt-orange uppercase tracking-[0.2em]">Verified Galactic Ledger Matches</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {(reportType === 'simple' || reportType === 'custom') && (
                          <button
                            onClick={downloadFullReportPdf}
                            className="flex items-center gap-3 px-6 py-3 border-2 border-[#FF0500] bg-[#E25530] text-white hover:bg-[#E25530]/80 rounded-xl text-[9px] uppercase tracking-[0.2em] font-bold transition-all shadow-[0_4px_20px_rgba(255,5,0,0.1)] active:scale-[0.98]"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF Report</span>
                          </button>
                        )}
                        <button
                          onClick={downloadCsv}
                          className="flex items-center gap-3 px-6 py-3 border-2 border-[#FF0500] bg-[#E25530] text-white hover:bg-[#E25530]/80 rounded-xl text-[9px] uppercase tracking-[0.2em] font-bold transition-all shadow-[0_4px_20px_rgba(255,5,0,0.1)] active:scale-[0.98]"
                        >
                          <Table className="w-3.5 h-3.5" />
                          <span>Download CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* Top Synchronized Scrollbar */}
                    {tableWidth > containerWidth && (
                      <div 
                        ref={topScrollRef} 
                        className="overflow-x-auto custom-scrollbar scrollbar-thin scrollbar-thumb-[#E25530] scrollbar-track-transparent mb-1" 
                        onScroll={handleTopScroll}
                        style={{ width: '100%', scrollbarWidth: 'thin' }}
                      >
                        <div style={{ width: `${tableWidth}px`, height: '1px' }}></div>
                      </div>
                    )}

                    <div 
                      ref={bottomScrollRef}
                      onScroll={handleBottomScroll}
                      className="overflow-x-auto custom-scrollbar scrollbar-thin scrollbar-thumb-[#E25530] scrollbar-track-transparent"
                      style={{ width: '100%', scrollbarWidth: 'thin' }}
                    >
                      <table ref={tableRef} className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-agt-orange/[0.02] border-b-2 border-[#FF0500]">
                            {columns.filter(col => col.enabled).map((col, idx) => {
                              const isCurrentSort = sortColumn === col.name;
                              const isUrl = isUrlColumn(col.rawIndex, col.name);
                              return (
                                <th 
                                  key={idx} 
                                  onClick={() => handleSortColumn(col.name)}
                                  className={`py-2 px-4 text-[9px] uppercase tracking-widest font-bold text-agt-orange cursor-pointer hover:bg-agt-orange/5 select-none transition-colors leading-tight ${
                                    isUrl 
                                      ? 'whitespace-normal break-words min-w-[75px] max-w-[100px]' 
                                      : 'whitespace-nowrap'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span>{col.name}</span>
                                    <span className="inline-flex shrink-0">
                                      {isCurrentSort ? (
                                        sortDirection === 'asc' ? (
                                          <ArrowUp className="w-3 h-3 text-white" />
                                        ) : (
                                          <ArrowDown className="w-3 h-3 text-white" />
                                        )
                                      ) : (
                                        <ArrowUpDown className="w-3 h-3 text-agt-orange/20 hover:text-agt-orange/50 transition-colors" />
                                      )}
                                    </span>
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#FF0500]/30">
                          {paginatedRecords.map((record, rIdx) => (
                            <tr key={rIdx} className="hover:bg-agt-orange/[0.02] transition-colors group">
                              {columns.filter(col => col.enabled).map((col, cIdx) => {
                                const cellVal = getDisplayValue(record[col.name], col.rawIndex);
                                const isUrl = isUrlColumn(col.rawIndex, col.name, record[col.name]);
                                
                                if (isUrl) {
                                  const hasLink = record[col.name] && String(record[col.name]).trim() !== '';
                                  return (
                                    <td 
                                      key={cIdx} 
                                      className="py-1 px-4 text-[10px] font-mono text-center min-w-[75px] max-w-[100px]"
                                    >
                                      {hasLink ? (
                                        <a
                                          href={String(record[col.name])}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-500 hover:text-blue-400 hover:underline font-bold transition-colors"
                                        >
                                          LINK
                                        </a>
                                      ) : (
                                        <span className="text-agt-orange/40">-</span>
                                      )}
                                    </td>
                                  );
                                }
                                
                                return (
                                  <td key={cIdx} className="py-1 px-4 text-[10px] text-agt-orange font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                    {cellVal || <span className="text-agt-orange italic">-</span>}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t-2 border-[#FF0500] bg-black/40">
                          <tr>
                            {columns.filter(col => col.enabled).map((col, idx) => (
                              <td key={idx} className="py-2 px-4 text-[10px] font-bold text-agt-orange">
                                {col.name === columns[0]?.name ? (
                                  <div className="flex flex-col">
                                    <span className="text-[8px] text-agt-orange uppercase tracking-tighter">Total Matches</span>
                                    <span>{matchedRecords.length}</span>
                                  </div>
                                ) : null}
                              </td>
                            ))}
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Glowing Navigation Bar right below the table */}
                    {matchedRecords.length > 15 && (
                      <div className="p-5 border-t border-agt-orange/20 flex flex-col md:flex-row items-center justify-between gap-4 bg-black/60 shadow-[0_0_20px_rgba(255,180,81,0.08)]">
                        {/* Page Range Display on the left */}
                        <div className="text-[10px] md:text-xs uppercase tracking-[0.15em] font-bold text-agt-orange font-mono">
                          Showing Page <span className="text-white font-extrabold">{currentPage}</span> of <span className="text-white font-extrabold">{totalPages}</span> <span className="text-agt-orange/50">({matchedRecords.length} total rows)</span>
                        </div>

                        {/* Responsive Controls on the right */}
                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                          {/* First Button */}
                          <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 border border-agt-orange/20 rounded-xl text-[9px] uppercase tracking-[0.2em] font-black text-agt-orange hover:bg-agt-orange/15 hover:border-agt-orange/40 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-[0.97]"
                          >
                            First
                          </button>

                          {/* Prev Button */}
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 border border-agt-orange/20 rounded-xl text-[9px] uppercase tracking-[0.2em] font-black text-agt-orange hover:bg-agt-orange/15 hover:border-agt-orange/40 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-[0.97]"
                          >
                            Prev
                          </button>

                          {/* Page Numbers with Radius = 2 */}
                          <div className="flex items-center gap-1">
                            {getVisiblePages().map((page, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  if (typeof page === 'number') {
                                    setCurrentPage(page);
                                  }
                                }}
                                disabled={typeof page !== 'number'}
                                className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl text-[10px] font-mono font-bold transition-all border ${
                                  typeof page !== 'number'
                                    ? 'text-agt-orange/40 border-transparent pointer-events-none'
                                    : currentPage === page
                                      ? 'bg-agt-orange text-black border-agt-orange shadow-[0_0_15px_rgba(255,180,81,0.85)] font-black'
                                      : 'text-agt-orange border-agt-orange/10 hover:bg-agt-orange/10 hover:border-agt-orange/30'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                          </div>

                          {/* Next Button */}
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 border border-agt-orange/20 rounded-xl text-[9px] uppercase tracking-[0.2em] font-black text-agt-orange hover:bg-agt-orange/15 hover:border-agt-orange/40 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-[0.97]"
                          >
                            Next
                          </button>

                          {/* Last Button */}
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 border border-agt-orange/20 rounded-xl text-[9px] uppercase tracking-[0.2em] font-black text-agt-orange hover:bg-agt-orange/15 hover:border-agt-orange/40 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-[0.97]"
                          >
                            Last
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="p-6 border-t border-agt-orange/5 flex flex-col md:flex-row items-center justify-between gap-6 bg-agt-orange/[0.01]">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          loading 
                            ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.7)] animate-pulse'
                            : (sheetUrl && !error && data.length > 0)
                              ? (isUsingCache 
                                  ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.7)] animate-pulse' 
                                  : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse')
                              : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)] animate-pulse'
                        }`}></div>
                        <span className="text-[10px] uppercase tracking-widest text-[#FFB451] font-bold font-mono">Ledger Integrity: Verified</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#FFB451]/60 uppercase tracking-widest md:text-right">
                        AGT SECURE ARCHIVE CLIENT
                      </span>
                    </div>
                  </motion.section>
                ) : !loading && (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-32 flex flex-col items-center justify-center text-center space-y-6 opacity-20 border border-agt-orange/5 rounded-2xl bg-agt-orange/[0.01]"
                  >
                    <div className="w-16 h-16 rounded-full border border-agt-orange/10 flex items-center justify-center">
                      <Database className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium uppercase tracking-[0.2em]">Terminal Ready</p>
                      <p className="text-xs font-light">Report Generation Sequence Pending Civilization Selection</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Area */}
      <footer className="bg-[#FFB451] mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col items-center gap-6 text-black">
          <div className="flex flex-wrap justify-center items-center gap-y-2 text-[10px] uppercase tracking-[0.2em] font-bold">
            <a href="https://www.nms-agt.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">Home</a>
            <span className="ml-1 mr-2 text-black/40">|</span>
            <a href="https://www.nms-agt.com/about-the-agt" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">About</a>
            <span className="ml-1 mr-2 text-black/40">|</span>
            <a href="https://www.nms-agt.com/team" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">Team</a>
            <span className="ml-1 mr-2 text-black/40">|</span>
            <a href="https://www.nms-agt.com/contribute" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">Contribute</a>
            <span className="ml-1 mr-2 text-black/40">|</span>
            <a href="https://www.nms-agt.com/agt-galactic-archives" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">Galactic Archives</a>
            <span className="ml-1 mr-2 text-black/40">|</span>
            <a href="https://www.nms-agt.com/engage" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">Engage</a>
            <span className="ml-1 mr-2 text-black/40">|</span>
            <a href="https://www.nms-agt.com/agt-navi" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">AGT NAVI</a>
            <span className="ml-1 mr-2 text-black/40">|</span>
            <a href="https://www.nms-agt.com/terms" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">Terms</a>
            <span className="ml-1 mr-2 text-black/40">|</span>
            <a href="https://www.nms-agt.com/support" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">Support</a>
            <span className="ml-1 mr-2 text-black/40">|</span>
            <a href="https://www.nms-agt.com/terms/copyright" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">Copyright</a>
          </div>
          <p className="text-[9px] font-mono uppercase tracking-[0.3em] font-bold">&copy; 2026 Alliance of Galactic Travellers</p>
        </div>
      </footer>

      {/* Background Audio */}
      <audio 
        ref={audioRef}
        src="/AGT Anthem (Instrumental).mp3"
        loop
        preload="auto"
      />

      {/* Horizontally Rotating Spinner Overlay */}
      <AnimatePresence>
        {showExtractorSpinner && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070707]/95 backdrop-blur-md">
            <motion.img
              src="/AGTIcon.png"
              alt="Searching AGT Records..."
              className="w-40 h-40 object-contain"
              animate={{ rotateY: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = '/AGTicon.png'; // fallback
              }}
            />
            <p className="mt-8 text-lg font-mono font-black tracking-widest uppercase text-[#E25530]">
              Searching AGT Base Records
            </p>
          </div>
        )}
      </AnimatePresence>

      {/* Branded AGT Alert/Notification Popup Modal Overlay */}
      <AnimatePresence>
        {popupMsg && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#141414] border-2 border-[#FF0500] rounded-3xl p-6 text-center space-y-6 shadow-[0_0_50px_rgba(255,5,0,0.35)]"
            >
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-black border-2 border-[#FF0500] flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-[#FF0500]" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-md uppercase font-mono tracking-widest text-[#FFFFB0]">
                  AGT TRANSIT SECURITY
                </h4>
                <p className="text-sm font-mono text-white leading-relaxed">
                  {popupMsg}
                </p>
              </div>
              <button
                onClick={() => setPopupMsg(null)}
                className="w-full py-2.5 border-2 border-[#FF0500] bg-[#E25530] text-white hover:bg-[#E25530]/80 rounded-full font-bold text-xs uppercase tracking-widest transition-all font-mono active:scale-[0.97]"
              >
                Acknowledge
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

