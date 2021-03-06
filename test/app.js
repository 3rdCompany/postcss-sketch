import React from 'react';
import { render } from 'react-dom';
import 'semantic-ui-css/semantic.min.css';
import styles from './test.css';

// Component Examples
import ButtonExample from './components/button';
import Menu from './components/menu';

class App extends React.Component {
    render() {
        return (
            <div>
                <div className="container">
                    <h1>PostCSS Sketch Plugin</h1>
                    <h2>Updates in real-time</h2>
                    <p>
                        Lorem Ipsum is simply dummy text of the printing and
                        typesetting industry. Lorem Ipsum has been the
                        industry's
                        standard dummy text ever since the 1500s, when an
                        unknown
                        printer took a galley of type and scrambled it to
                        make a
                        type specimen book. It has survived not only five
                        centuries,
                        but also the leap into electronic typesetting,
                        remaining
                        essentially unchanged.
                        From{' '}
                        <a href="http://lipsum.lipsum.com/">
                            lipsum.lipsum.com
                        </a>
                    </p>
                    <div className="sharedStyle">
                        Complex Shared Style Test, featuring fills, border
                        and
                        shadow.
                    </div>
                    <br />
                    <ButtonExample />
                    <Menu />
                    <div className="featureEvent"></div>
                </div>
            </div>
        );
    }
}

render(<App />, document.getElementById('app'));
