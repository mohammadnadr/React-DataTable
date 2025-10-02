import React from 'react';
import { ConfigProvider } from 'antd';
import './App.css';
import CashFlowConsole from "./View/CashFlow/CashFlowConsole";


function App() {
    return (
        <ConfigProvider >
            <div className="App">
               <CashFlowConsole/>
            </div>
        </ConfigProvider>
    );
}

export default App;