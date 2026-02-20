import { useEffect, useRef, useState, useCallback } from 'react';
import api from '../src/api';

export interface UseLandscapeControlsProps {
  activation: string;
  depth: number;
  width: number;
  method: string;
  data: string;
  loss: string;
}

export function useLandscapeControls(props: UseLandscapeControlsProps){
    const {
        activation,
        depth,
        width,
        method,
        data,
        loss,
    } = props;

    const dataRef = useRef<string>(data);
    const [csv, setCsv] = useState<string | null>(null);

    const [datasetParameters, setDatasetParameters] = useState<string[] | null>(['x']);
    const [datasetOutputs, setDatasetOutputs] = useState<number | null>(1);

    const [loadingCsv, setLoadingCsv] = useState<boolean | null>(false);
    const [csvLoaded, setLoadedCsv] = useState<boolean | null>(false);

    /**
     * Parses a CSV file as a string
     */
    const parseAndValidateCSV = async (csv: File) => {
        return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        // Read the file as a string
        reader.readAsText(csv, 'UTF-8');
        });
    };

    const handleUploadCsv = useCallback(async (file: File) => {
        try {
            setLoadingCsv(true);
            // Parse as string
            const csvString = await parseAndValidateCSV(file);

            // Get dataset shape from API
            const resp = await api.post('/getdatasetshape', { rawcsv: csvString });
            const dict = resp.data;
            if (!dict.inputs || !dict.outputs) { throw new Error("Invalid dataset shape response"); }
            setCsv(csvString);
            setDatasetParameters(dict.labels);
            setDatasetOutputs(dict.outputs);
            setLoadingCsv(false);
            setLoadedCsv(true);

        } catch (err) {
            setLoadingCsv(false);
            setLoadedCsv(false);
            console.error('Failed to upload CSV');
            alert('Inavlid CSV file selected');
        }
    }, []);


    return {
        handleUploadCsv,
        loadingCsv,
        csvLoaded,
        csv,
        datasetParameters,
        setDatasetParameters,
        datasetOutputs,
        setDatasetOutputs
    }
}