import React from 'react';

import './GameFilter.css';

const GameFilter = (props) => {

    const dropdownChangeHandler = (event) => {
        props.onChangeFilter(event.target.value)
    }

    return (
        <div className='game-filter'>
            <div className='game-filter__control'>
                <select value={props.selected} onChange={dropdownChangeHandler}>
                    <option value='GAME_GUN'>GAME_GUN</option>
                    <option value='HAMMER_GAME'>HAMMER_GAME</option>
                    <option value='OTHERS_GAME'>OTHERS_GAME</option>
                </select>
            </div>
        </div>
    );
};

export default GameFilter;