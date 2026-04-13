import React, { ReactNode } from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon } from './icons';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
    public state: State;
    public props!: Props & { children?: React.ReactNode };

    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-white font-sans">
                    <div className="max-w-md w-full glass-premium p-8 rounded-3xl text-center space-y-6">
                        <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-500">
                            <ExclamationTriangleIcon className="w-10 h-10" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold">Something went wrong</h1>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                The application encountered an unexpected error. This might be due to a local data sync issue or an intermittent service failure.
                            </p>
                        </div>

                        <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-left">
                            <p className="text-[10px] font-medium text-rose-400 uppercase tracking-widest mb-1">Error Trace</p>
                            <p className="text-xs text-gray-500 font-mono break-all line-clamp-3">
                                {this.state.error?.message || 'Unknown systemic error'}
                            </p>
                        </div>

                        <button
                            onClick={this.handleReload}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-2xl font-semibold shadow-xl transition-all flex items-center justify-center gap-2 group"
                        >
                            <ArrowPathIcon className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                            Reset & Restart
                        </button>

                        <p className="text-xs text-gray-600">
                            Personal data is stored locally and will not be lost.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
