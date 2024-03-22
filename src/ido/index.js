import React, { useEffect, useReducer } from 'react'

import { ethers } from 'ethers';
import king from '../asset/king.jpg';
import question from '../asset/question.jpg';
import pdkSougou from '../asset/pdk-sougou.png';
import pdkSvg from '../asset/pdk.svg';
import guorenprojPng from '../asset/guorenproj.png';
import pay from '../asset/pay.gif';
import styles from './index.module.css';

import { isConnected2MetaMask, sendTransaction } from '../utils/eth-utils';
import CONSTANTS from '../constants';

window.ethers = ethers;

// let transaction = {
//   to: CONSTANTS.myAddr,
//   value: ethers.utils.parseEther(String('0.011')),
// };

// const provider = new ethers.providers.Web3Provider(window.ethereum)
// const signer = provider.getSigner()
// try {
//   const tx = signer.sendTransaction(transaction).then((res) => {
//     alert(res);
//   });
//   console.log(tx);
// }
// catch (error) {
//   alert(JSON.stringify(error));
// }


const web3Reducer = (state, action) => {
  switch (action.type) {
    case 'SET_isWeb3':
      return { ...state, isWeb3: action.isWeb3 }
    case 'SET_isEnabled':
      return { ...state, isEnabled: action.isEnabled }
    case 'SET_account':
      return { ...state, account: action.account }
    case 'SET_provider':
      return { ...state, provider: action.provider }
    case 'SET_network':
      return { ...state, network: action.network }
    case 'SET_signer':
      return { ...state, signer: action.signer }
    case 'SET_balance':
      return { ...state, balance: action.balance }
    default:
      throw new Error(`Unhandled action ${action.type} in web3Reducer`)
  }
}

const dappReducer = (state, action) => {
  switch (action.type) {
    case 'SET_isConnecting':
      return { ...state, isConnecting: action.isConnecting }
    default:
      throw new Error(`Unhandled action ${action.type} in dappReducer`)
  }
}

const initialDappState = {
  isConnecting: false,
}

const initialWeb3State = {
  isWeb3: false,
  isEnabled: false,
  account: ethers.constants.AddressZero,
  provider: null,
  signer: null,
  network: null,
  balance: '0',
}


function App() {
  const [web3State, web3Dispatch] = useReducer(web3Reducer, initialWeb3State);
  const [dappState, dappDispatch] = useReducer(dappReducer, initialDappState);

  window.web3State = web3State;
  window.dappState = dappState;

  const handleOnConnect = () => {
    if (!web3State.isEnabled)
      dappDispatch({ type: 'SET_isConnecting', isConnecting: true })
  }

  // Check if Web3 is injected
  useEffect(() => {
    if (typeof ethereum !== 'undefined') {
      web3Dispatch({ type: 'SET_isWeb3', isWeb3: true })
    } else {
      web3Dispatch({ type: 'SET_isWeb3', isWeb3: false })
    }
  }, [])

  // Check if already connected to MetaMask
  useEffect(() => {
    const isConnected = async () => {
      const account = await isConnected2MetaMask()
      if (account) {
        web3Dispatch({ type: 'SET_isEnabled', isEnabled: true })
        web3Dispatch({ type: 'SET_account', account: account })
      } else {
        web3Dispatch({ type: 'SET_isEnabled', isEnabled: false })
      }
    }
    if (web3State.isWeb3) {
      isConnected()
    }
  }, [web3State.isWeb3])

  //If not connected to metamask connect with button
  useEffect(() => {
    const connect2MetaMask = async () => {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        })
        web3Dispatch({ type: 'SET_isEnabled', isEnabled: true })
        web3Dispatch({ type: 'SET_account', account: accounts[0] })
      } catch (e) {
        web3Dispatch({
          type: 'SET_account',
          account: ethers.constants.AddressZero,
        })
        web3Dispatch({ type: 'SET_isEnabled', isEnabled: false })
      } finally {
        dappDispatch({ type: 'SET_isConnecting', isConnecting: false })
      }
    }

    if (web3State.isWeb3 && dappState.isConnecting && !web3State.isEnabled) {
      connect2MetaMask()
    }
  }, [web3State.isWeb3, dappState.isConnecting, web3State.isEnabled])

  // Connect to provider
  useEffect(() => {
    const connect2Provider = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        web3Dispatch({ type: 'SET_provider', provider: provider })
        const signer = provider.getSigner()
        web3Dispatch({ type: 'SET_signer', signer: signer })
        // https://docs.ethers.io/v5/api/providers/provider/#Provider-getBalance
        const network = await provider.getNetwork()
        web3Dispatch({ type: 'SET_network', network: network })
        // https://docs.ethers.io/v5/api/providers/provider/#Provider-getBalance
        const _balance = await provider.getBalance(web3State.account)
        // https://docs.ethers.io/v5/api/utils/display-logic/#utils-formatEther
        const balance = ethers.utils.formatEther(_balance)
        web3Dispatch({ type: 'SET_balance', balance: balance })
      } catch (e) {
        web3Dispatch({ type: 'SET_network', network: initialWeb3State.network })
        web3Dispatch({ type: 'SET_balance', balance: initialWeb3State.balance })
      }
    }

    if (
      web3State.isEnabled &&
      web3State.account !== ethers.constants.AddressZero
    ) {
      connect2Provider()
    }
  }, [web3State.isEnabled, web3State.account])

  const donate = async () => {
    console.log('web3State', web3State);
    if (56 !== web3State.network.chainId) {
      alert('请切换到 bsc 网络（BNB Smart Chain Mainnet）');
      return;
    }
    if (web3State.balance < 0.011) {
      alert('不够足够的 BNB 打款，' + '你当前的余额为： ' + web3State.balance );
      return;
    }

    let transaction = {
      to: CONSTANTS.myAddr,
      value: ethers.utils.parseEther(String('0.011')),
    };

    try {
      alert('请确认打款信息：直接 transfer 0.011 BNB 到 ' + CONSTANTS.myAddr)
      const tx = await sendTransaction(
        web3State.signer,
        web3State.provider,
        transaction,
      );

      if (tx) {
        alert('打款成功了，感谢支持。坐等 ido 成功吧。');
      }
      else {
        alert('打款失败了');
      }
    } catch (error) {
      alert(JSON.stringify(error));
    }
  }

  return (
    <div className={styles.idoWarper}>
      <div className={styles.imgWarper}>
        <div><img src={king} alt="king" /></div>
        <div><img src={question} alt="king" /></div>
      </div>

      <div>
        <section>
          <h3>口号</h3>
          <div>Let’s make #BNBChain great again!!!🚀🚀</div>
        </section>
        <section>
          <h3>发行什么币</h3>
          <div>
            <img src={pdkSvg} alt="" className={styles.logo} />
          </div>
          <div>即将发行一个数字货币，但是为了群众的参与感（打钱），就简单粗暴试试募资。</div>
          <div>这个币叫做 PDK ，暂且定义为：跑得快。</div>
          <div>看图，你也可以将它定义为其他名字。</div>
          <div>
            <img src={pdkSougou} alt="" className={styles.pdkSougou} />
          </div>
        </section>

        <section>
          <h3>注意</h3>
          <div>这是一个中国人发行的项目，希望能以此项目改变 Twitter 上各种说国人的项目不能碰的说法。</div>
          <div>大家放心冲。</div>
          <div className={styles.guorenprojPngC}>
            <img src={guorenprojPng} alt="" className="" />
          </div>
        </section>

        <section>
          <h3>关于这个币</h3>
          <div>目前该币尚未发行，合约地址也还没有，等后期发行了，会在这里公布。</div>
          <div>假如现有 PDK 这个币，都不是这里面提到的 PDK。</div>
          <div>发行总额为 1 万亿个（上限）？还是一亿个（下限）？太多 0 了有点看不过来。</div>
          <div>发行个数为 1 亿至 1 万亿个之间，由社区讨论决定。</div>
        </section>

        <section>
          <h3>募资金额</h3>
          <div>最低目标是筹备 1.1 BNB (就是大概100个参与者) 。</div>
          <div>最高目标： 1100 BNB 。</div>
          <div>如果募资高于两倍 BNB ，那么开发者将截留 1 BNB 最为最初的买域名费用（假如后期买的话）。</div>
          <div>每次募资金额为 0.011 BNB ，不等于这个金额的，将当成无偿捐赠，由社区决定如何使用。</div>
          <div>每个账号没有限制打多少次，但是多次打将记录为一次。</div>
          <div>剩余 BNB 将扣除手续费和 50% 的币加入 LP 池，</div>
          <div>并且马上将 LP 池打到黑洞地址，这里是马上打到黑洞。</div>
          <div>假如募资金额过大，例如大于 1000 BNB （此处尚未决定 LP 上限），</div>
          <div>那么最多将 1000 BNB 放入 LP 池子，剩余的部分同样由社区决定如何使用。</div>
          <div>对于每个参与打款的账号，将在该币发行的时候，象征性给每个人打 100 个 PDK 。</div>
          <div>反正募资的那个 0.011 BNB 肯定能买不少的，不要期望募资的币能卖回本。</div>
        </section>

        <section>
          <h3>募资失败？</h3>
          <div>如果最后募集失败，将每人募集的 0.01 原路打回， 0.001 作为手续费。</div>
          <div>假如没任何人参与这个募资，那这个币还是不发行了。</div>
          <div>为啥募资失败就不发行？因为如果没有人知道，那这个发行了也没用。</div>
          <div>如果你捐赠后又反悔了，请在添加 LP 之前邮箱联系。<br />开发者将扣除链路手续费之后原路打回。</div>
        </section>

        <section>
          <h3>有没有审计？</h3>
          <div>没有。</div>
          <div>这份代码将直接 fork 某个主流 ERC20 币的方式来发行。</div>
          {/* <div>目前借鉴的火币链的 DOG ，但是会去掉交易里面加流动池的行为。</div> */}
          {/* <div>预期是通缩+持有就分红机制。</div> */}
        </section>

        <section>
          <h3>这个币的意义？</h3>
          <div>可能只是一个游戏。</div>
          <div>按照理论来说，只要我跑得足够快，庄家会不会割到我。</div>
          <div>如果你是第一个跑进去的，那么你就是庄家。</div>
          <div>但是，谁会笑到最后呢？</div>
          <div>假如全部人都跑了，那么没跑的那个就是庄家了。</div>
          <div>这时候需要你重新宣传它。</div>
          <div>这将生生不息。</div>
        </section>

        <section>
          <h3>所以</h3>
          <div>
            <img src={pay} alt="pay" />
          </div>
          <br />
          <div>打款到: {CONSTANTS.myAddr}</div>

          {
          web3State.isEnabled &&
          web3State.network !== null &&
          web3State.account !== ethers.constants.AddressZero && (
            <div>
              <div>你的余额: {web3State.balance} BNB</div>
              <br />
              <div className={styles.button} onClick={donate}>打款 0.011 BNB</div>
            </div>
          )}

          {!web3State.isEnabled && (
            <div className={styles.button} onClick={handleOnConnect}>链接钱包</div>
          )}
        </section>
      </div>

      <div className={styles.createAt}>
        此信息创建于： 2024年03月22日。<br />
        {/* 如有疑问，咨询： tokenpdk@gmail.com */}
      </div>
    </div>
  );
}

export default App;
