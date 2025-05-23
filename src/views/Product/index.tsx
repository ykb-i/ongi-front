import React, { ChangeEvent, useEffect, useState } from 'react'
import "./style.css"
import { getProductCategoryRequest, getProductReviewsRequest } from 'src/apis';
import { GetProductResponseDto, ResponseDto } from 'src/apis/dto/response';
import { responseMessage } from 'src/utils';
import { Product } from 'src/types/interfaces';
import { useNavigate } from 'react-router';
import { ACCESS_TOKEN, PRODUCT_VIEW_ABSOLUTE_PATH, PRODUCT_WRITE_PATH } from 'src/constants';
import Pagination from 'src/components/Pagination';
import { usePagination } from 'src/hooks';
import Sort from 'src/types/aliases/sort.alias';
import { Category } from 'src/types/aliases';
import { useCookies } from 'react-cookie';

interface TableItemProps {
  product: Product;
}

const categoryList:Category[] = [
  '전체',
  '가전제품',
  '건강식품',
  '패션의류',
  '스포츠',
  '식품',
  '뷰티',
  '기타'
]

// function: 마감까지 남은 시간 처리 함수 //
const getTimeUntilDeadLine = (deadline: string | Date) => {
  const today = new Date();
  const target = new Date(deadline)

  const diff = target.getTime() - today.getTime();
  if(diff <= 0) return 0;
 
  return diff;
}

// function: 현재 날짜 구하기 함수 //
const getToday = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

// component: 상품 테이블 레코드 컴포넌트 //
function TableItem({product, index}: TableItemProps & {index: number}){
  const { sequence, image, name, price, rating, productQuantity, 
          boughtAmount, deadline, openDate, status, reviewCount } = product;

  // state: 모집 완료 여부 상태 //
  const [isFinish, setIsFinish] = useState<boolean>(false);
  // state: 잔여 상품수 상태 //
  const [remainingProducts, setRemainingProducts] = useState<number>(productQuantity);
  // state: 달성율 상태 //
  const [achievementRate, setAchievementRate] = useState<number>(Math.floor((boughtAmount / productQuantity) * 100));
  // state: 마감기한 상태 //
  const [remainingTime, setRemainingTime] = useState<number>(getTimeUntilDeadLine(deadline));
  // state: 상품 마감 상태 //
  const [productStatus, setProductStatus] = useState<string>('');

  // variable: 상품 이미지 클래스 //
  const imageClass = status === "CLOSE" ? 'product-thumbnail expired' : 'product-thumbnail';

  // function: 네비게이터 함수 //
  const navigator = useNavigate();

  // function: 요일 변환 함수 //
  const changeDateFormat = (diff: number) => {
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor(((diff % (1000 * 60 * 60 * 24)) % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}일 ${hours}시간 ${minutes}분 남음`;
  }; 

  // event handler: 테이블 클릭 이벤트 핸들러 //
  const onClick = () => {
    navigator(PRODUCT_VIEW_ABSOLUTE_PATH(sequence));
  }

  useEffect(() => {
  
    setRemainingProducts(productQuantity - boughtAmount);
    setAchievementRate(Math.floor((boughtAmount / productQuantity) * 100));
  },[boughtAmount, productQuantity])

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingTime(getTimeUntilDeadLine(deadline));
    }, 1000 * 60);

    return () => clearInterval(interval);
  },[deadline]);

  useEffect(() => {
    if(remainingProducts === 0 || remainingTime === 0) setProductStatus('CLOSE');
  },[])

  return (
    <li className='product-card'>
      <div className='product-card-inner'>
        <div className='product-card-area' onClick={onClick}>
          <div className={imageClass}>
            <img src={image} alt='업로드된 이미지'/>
            {status === "CLOSE" && 
              <div className='img-text'>
                <p>마감</p>
              </div>
            }

          </div>
          <div className='information'>
            <div className='publisher'>{name}</div>
            <div className='title'>{name}</div>
            <div className='price'>개당 {price.toLocaleString()}원</div>
            <div className='quantity'>
            <div className='buy-quantity'>잔여 수량: {remainingProducts.toLocaleString()}개</div>
              <div className='total-quantity'>/ &nbsp; 총 {productQuantity.toLocaleString()}개</div>
            </div>
            <div className='achievement-rate'>{achievementRate}% 달성</div>
            {status === "OPEN" && 
              <div className='deadline-box'>
                <div className='deadline-title color-title'>마감까지</div>
                <div className='deadline-title normal'>{changeDateFormat(remainingTime)}</div>
              </div>
            }
            {status === "WAIT" &&
              <div className='deadline-box'>
                <div className='deadline-title color-title'>오픈예정일</div>
                <div className='deadline-title normal'>{openDate}</div>
              </div>
            } 
            <ul className='review-area'>
              <li className='review-rating'>
                <div className='rating-icon'></div>
                <div className='rating'>{rating}점</div>
              </li>
              <div className='review-count'>리뷰 ({reviewCount})</div>
            </ul>
          </div>
        </div>
      </div>
    </li>
  )
}

// component: 공동구매 메인 화면 컴포넌트 //
export default function ProductMain() {

  
  // state: 페이지네이션 상태 //
  const { 
    currentPage, setCurrentPage, currentSection, setCurrentSection,
    totalSection, setTotalList, viewList, pageList, totalList
  } = usePagination<Product>();

  // state: cookie 상태 //
  const [cookies] = useCookies();
  // state: 정렬 상태 //
  const [sort, setSort] = useState<Sort>('');
  // state: 카테고리 상태 // 
  const [category, setCategory] = useState<Category>('전체');
  // state: 검색어 입력 상태 //
  const [searchName, setSearchName] = useState<string>('');
  // state: 검색어 상태 //
  const [name, setName] = useState<string>('');
  // state: 빈 리스트 반환시 문자열 상태 //
  const [filterMessage, setFilterMessage] = useState<string>('');

  // variable: access token //
  const accessToken = cookies[ACCESS_TOKEN];

  // variable: 정렬방식 클래스 //
  const sortDeadlineClass = 
    sort === '마감임박' ? 'sort-content active' : 'sort-content';
  const sortHotClass = 
    sort === '인기' ? 'sort-content active' : 'sort-content';

  const isClosed = (status: string) => status === 'CLOSE';

  // function: 네비게이터 함수 //
  const navigator = useNavigate();

  // function: get product response 처리 함수 //
  const getProductResponse = (responseBody: GetProductResponseDto | ResponseDto | null) => {
    const { isSuccess, message } = responseMessage(responseBody);

    if(!isSuccess) {
      alert(message);
      return;
    }
    const { products, filterType } = responseBody as GetProductResponseDto;
    if(products.length === 0){
      if(filterType === 'categoryAndName') setFilterMessage(`${category}에 ${name}이(가) 포함된 상품이 없습니다!!`);
      else if(filterType === 'category') setFilterMessage(`${category} 상품이 없습니다!!`);
      else if(filterType === 'name') setFilterMessage(`${name}이(가) 포함된 상품이 없습니다!!`);
      else setFilterMessage(`등록된 상품이 없습니다!!`);
    }else setFilterMessage('');
    
    products.sort(
      (a,b) => {
        const aIsClosed = isClosed(a.status);
        const bIsClosed = isClosed(b.status);

        // 마감된 상품은 항상 뒤로
        if (aIsClosed && !bIsClosed) return 1;
        if (!aIsClosed && bIsClosed) return -1;
        return 0;
      }
    )
    setTotalList(products);
    
  }

  // function: filter type 처리 함수 //
  const filter = () => {

  }

  // event handler: 작성 버튼 클릭 이벤트 핸들러 //
  const onWriteClickHandler = () => {
    navigator(PRODUCT_WRITE_PATH);
  }

  // event handler: 검색 버튼 클릭 이벤트 핸들러 //
  const onSearchClickHandler = () => {
    setName(searchName);
  }

  // event handler: 정렬방식 변경 이벤트 핸들러 //
  const onSortChangeHandler = (sort: Sort) => {
    setSort(sort);
  }
  
  // event handler: 카테고리 변경 이벤트 핸들러 //
  const onCategoryChangeHandler = (e:ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.currentTarget;

    setCategory(value as Category);
  }

  // event handler: 검색어 변경 이벤트 핸들러 //
  const onSearchNameChangeHandler = (e:ChangeEvent<HTMLInputElement>) => {
    const { value } = e.currentTarget;

    setSearchName(value);
  }

  // effect: 정렬 방식 변경 시 실행할 함수 //
  useEffect(() => {
    const sortedProducts = [...totalList];
    
    if(sort === '마감임박'){
      sortedProducts.sort((a, b) => {
        const aIsClosed = isClosed(a.status);
        const bIsClosed = isClosed(b.status);

        // 마감된 상품은 항상 뒤로
        if (aIsClosed && !bIsClosed) return 1;
        if (!aIsClosed && bIsClosed) return -1;

        const timeA = getTimeUntilDeadLine(a.deadline);
        const timeB = getTimeUntilDeadLine(b.deadline);

        // 남은 시간 오름차순 (마감 임박 순)
        return timeA - timeB;
      })
    } else {
      sortedProducts.sort((a, b) => {
        const aIsClosed = isClosed(a.status);
        const bIsClosed = isClosed(b.status);

        if (aIsClosed && !bIsClosed) return 1;  // a는 마감 → 뒤로
        if (!aIsClosed && bIsClosed) return -1; // b는 마감 → 뒤로

        // 둘 다 마감이 아니면 인기순 내림차순
        return b.boughtAmount - a.boughtAmount;
      });
    }

    setTotalList(sortedProducts);
  },[sort]);

  // effect: 카테고리 변경 시 실행할 함수 //
  useEffect(() => {
    getProductCategoryRequest(category, name, accessToken).then(getProductResponse);
  },[category, name]);
  // render: 공동구매 메인 화면 컴포넌트 렌더링 //
  return (
    <div id='product-main-wrapper'>
      <div className='main-container'>
        <div className='main-title'>
          <div className='main-title color-title'>공동구매</div>
          <div className='main-title normal'>게시판</div>
        </div>
        <div className='filter-container'>
          <div className='category-box'>
            <div className='title'>카테고리</div>
            <select onChange={onCategoryChangeHandler}>
              {categoryList.map((category, index) => (<option key={index} value={category} >{category}</option>))}
            </select>
          </div> 
          <div className='search-box'>
            <input value={searchName} onChange={onSearchNameChangeHandler} type='text'/> 
            <div className='search-button' onClick={onSearchClickHandler}></div>
          </div>
          <div className='sort-box'>
            <div className='title'>정렬방식</div>
            <div className='sort-content-list'>
              <div className={sortDeadlineClass} onClick={() => onSortChangeHandler('마감임박')}>마감임박</div>
              |
              <div className={sortHotClass} onClick={() => onSortChangeHandler('인기')}>인기</div>
            </div>
          </div>
          <div className='button-box'>
          
            <div className='write-button' onClick={onWriteClickHandler}>작성</div>
          </div>
        </div>
        <div className='product-list-container'>
          <ul className='product-list-table'>
            {totalList.length !== 0 && 
              viewList.map((product, index) => (<TableItem key={product.sequence} product={product} index={index}/>))
            }
            {totalList.length === 0 &&
              <div className='no-category-product'>{filterMessage}</div>
            }
          </ul>
        </div>
        {totalList.length !== 0 &&

        <div className='pagination-container'>
          {totalSection !== 0 &&
            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              currentSection={currentSection}
              setCurrentSection={setCurrentSection}
              pageList={pageList}
              totalSection={totalSection}
            />
          }
        </div>
        }
        
      </div>
    </div>
  )
}

