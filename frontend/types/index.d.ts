import * as React from 'react';

export interface Column {
    id: string;
    label: string;
    type?: 'string' | 'number' | 'email' | 'date' | 'phone' | 'select';
    validators?: Validator[];
    transformations?: Transformer[];
    options?: string[];
    description?: string;
    placeholder?: string;
}

export type Validator = {
    type: 'required';
    message?: string;
} | {
    type: 'unique';
    message?: string;
} | {
    type: 'regex';
    pattern: string;
    message?: string;
} | {
    type: 'min';
    value: number;
    message?: string;
} | {
    type: 'max';
    value: number;
    message?: string;
} | {
    type: 'min_length';
    value: number;
    message?: string;
} | {
    type: 'max_length';
    value: number;
    message?: string;
};

export type TransformationStage = 'pre' | 'post';

export type Transformer = {
    type: 'trim';
    stage?: TransformationStage;
} | {
    type: 'uppercase';
    stage?: TransformationStage;
} | {
    type: 'lowercase';
    stage?: TransformationStage;
} | {
    type: 'capitalize';
    stage?: TransformationStage;
} | {
    type: 'remove_special_chars';
    stage?: TransformationStage;
} | {
    type: 'normalize_phone';
    stage?: TransformationStage;
} | {
    type: 'normalize_date';
    format?: string;
    stage?: TransformationStage;
} | {
    type: 'default';
    value: string;
    stage?: TransformationStage;
} | {
    type: 'replace';
    find: string;
    replace: string;
    stage?: TransformationStage;
} | {
    type: 'custom';
    fn: (value: any) => any;
    stage?: TransformationStage;
};

export interface ThemeConfig {
    font?: {
        family?: string;
        size?: string;
    };
    colors?: {
        primary?: string;
        secondary?: string;
        background?: string;
        text?: string;
        border?: string;
        hover?: string;
        disabled?: string;
    };
    borderRadius?: string;
    spacing?: {
        small?: string;
        medium?: string;
        large?: string;
    };
}

export interface CSVImporterProps {
    columns?: Column[];
    importerKey?: string;
    onComplete?: (data: any) => void;
    backendUrl?: string;
    user?: Record<string, any>;
    metadata?: Record<string, any>;
    theme?: ThemeConfig | 'default' | 'minimal' | 'modern' | 'compact' | 'dark';
    darkMode?: boolean;
    primaryColor?: string;
    className?: string;
    customStyles?: Record<string, string> | string;
    classNames?: {
        root?: string;
        modal?: string;
        header?: string;
        stepper?: string;
        content?: string;
        footer?: string;
        button?: string;
        input?: string;
        table?: string;
        dropzone?: string;
    };
    showDownloadTemplateButton?: boolean;
    skipHeaderRowSelection?: boolean;
    waitOnComplete?: boolean;
    invalidRowHandling?: 'include' | 'exclude' | 'block';
    includeUnmatchedColumns?: boolean;
    language?: string;
    customTranslations?: {
        [language: string]: {
            [key: string]: string;
        };
    };
    demoData?: {
        fileName: string;
        csvContent: string;
    };
    isModal?: boolean;
    modalIsOpen?: boolean;
    modalOnCloseTriggered?: () => void;
    modalCloseOnOutsideClick?: boolean;
}

declare const CSVImporter: React.FC<CSVImporterProps>;

export { CSVImporter };
export default CSVImporter;

export declare const importcsvStyles: string;