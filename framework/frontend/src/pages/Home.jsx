import React from 'react';
import Billboard from '../components/Billboard';
import AgentList from '../components/AgentList';

const Home = () => {
    return (
        <div className="flex-1 overflow-y-auto bg-canvas">
            {/* <Billboard />  Removed for Enterprise View */}
            <AgentList />
        </div>
    );
};

export default Home;
