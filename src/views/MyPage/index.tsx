import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import './style.css';
import { useNavigate } from 'react-router';
import MypageSidebar from 'src/layouts/MypageSidebar';
import { ACCESS_TOKEN, MYPAGE_ACCOUNT_ABSOLUTE_PATH } from 'src/constants';
import { useCookies } from 'react-cookie';
import { GetUserIntroductionResponseDto } from 'src/apis/dto/response/user';
import { LikeKeyword } from 'src/types/interfaces';
import { Gender, Mbti } from 'src/types/aliases';
import { addLikeKeywordRequest, deleteLikeKeywordRequest, fileUploadRequest, getUserIntroductionRequest, patchUserIntroductionRequest } from 'src/apis';
import { ResponseDto } from 'src/apis/dto/response';
import { AddLikeKeywordRequestDto, DeleteLikeKeywordRequestDto, PatchUserIntroductionRequestDto } from 'src/apis/dto/request/user';
import DefaultProfile from 'src/assets/images/default-profile.png';
import Modal from 'src/components/Modal';

// component: 마이 페이지 메인 화면 컴포넌트 //
export default function MyPage() {

  // state: 추가 삭제 키워드 상태 //
  const [addKeyword, setAddKeyword] = useState<string>('');
  const [deleteMode, setDeleteMode] = useState<boolean>(false);


  // function: add liked keyword response 처리 함수 //
  const addLikeKeywordResopnse = (responseBody: ResponseDto | null) => {
    const message =
      !responseBody ? '서버에 문제가 있습니다.' :
      responseBody.code === 'DBE' ? '서버에 문제가 있습니다.' : 
      responseBody.code === 'AF' ? '인증에 실패했습니다.' : '';
    
    const isSuccess = responseBody !== null && responseBody.code === 'SU';
    if (!isSuccess) {
      alert(message);
      return;
    }

    setLikeKeywords((likeKeywords) => [...(likeKeywords || []), { userId: accessToken, keyword: addKeyword }]);
    setAddKeyword('');
    setModalOpen(true);
  };

  // function: delete liked keyword response 처리 함수 //
  const deleteLikeKeywordResponse = (responseBody: ResponseDto | null, keyword: string) => {
    const message =
      !responseBody ? '서버에 문제가 있습니다.' :
      responseBody.code === 'DBE' ? '서버에 문제가 있습니다.' : 
      responseBody.code === 'AF' ? '인증에 실패했습니다.' : '';
    
    const isSuccess = responseBody !== null && responseBody.code === 'SU';
    if (!isSuccess) {
      alert(message);
      return;
    }

    setLikeKeywords(prev => prev.filter(k => k.keyword !== keyword));
  };

  // event handler: 키워드 추가 이벤트 처리 //
  const addKeywordChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setAddKeyword(value);
  };

  // event handler: 키워드 삭제 버튼 클릭 이벤트 처리
  const deleteKeywordClickHandler = () => {
    setDeleteMode(prev => !prev);
  }

  // event handler: 키워드 추가 버튼 클릭 이벤트 처리 //
  const onAddKeywordClickHandler = async () => {
    if (!addKeyword.trim()) {
      alert('키워드를 입력해주세요!');
      return;
    }

    const requestBody: AddLikeKeywordRequestDto = {
      keyword: addKeyword
    };

    if(likeKeywords !== null && likeKeywords.length > 10){
      alert('키워드를 삭제해주세요!');
    }

    addLikeKeywordRequest(requestBody, accessToken).then(addLikeKeywordResopnse);

  };

  // event handler: 키워드 삭제 버튼 클릭 이벤트 처리 //
  const onDeleteKeywordClickHandler = async (keyword: string) => {

    const requestBody: DeleteLikeKeywordRequestDto = {
      keyword: keyword
    };

    deleteLikeKeywordRequest(requestBody, accessToken).then((res) => deleteLikeKeywordResponse(res, keyword));

  };

  // state: cookie 상태 //
  const [cookies] = useCookies();

  // state: 파일 인풋 참조 상태 //
  const fileRef = useRef<HTMLInputElement | null>(null);
  
  // state: 로그인 사용자 상태 //
  const [nickname, setNickname] = useState<string>('');
  const [birth, setBirth] = useState<string>('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [profileImage, setProfileImage] = useState<string>('');
  const [mbti, setMbti] = useState<Mbti | null>(null);
  const [job, setJob] = useState<string>('');
  const [selfIntro, setSelfIntro] = useState<string>('');
  const [likeKeywords, setLikeKeywords] = useState<LikeKeyword[]>([]);

  // state: 수정 가능 상태 // 
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // state: 사용자 프로필 이미지 상태 //
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

  // state: 키워드 추가 모달 오픈 상태 //
  const [isModalOpen, setModalOpen] = useState<boolean>(false);

  
  // event handler: 수정 버튼 클릭 이벤트 처리 //
  const onModalOpenButtonClickHandler = () => {
    setModalOpen(!isModalOpen);
  };

  // variable: access Token //
  const accessToken = cookies[ACCESS_TOKEN];
  
  // variable: 자기소개 수정 가능 여부 //
  const isActive = nickname !== '' && birth !== '' &&  gender !== null &&  mbti !== null && 
  job !== '' && selfIntro !== '';

  // variable: 자기소개 수정 버튼 클래스 //
  const updateButtonClass = isEditMode ? isActive ? 'correction active' : 'correction disable' : 'correction';

  // variable: 자기소개 수정 버튼 텍스트 //
  const buttonText = isEditMode ? '수정 완료' : '정보 수정';

  // function: 네비게이터 함수 //
  const navigator = useNavigate();

  
  // function: get User Indroduction response 처리 함수 //
  const getUserIntroductionResponse = (responseBody: GetUserIntroductionResponseDto | ResponseDto | null) => {
    const message = 
      !responseBody ? '서버에 문제가 있습니다.' :
      responseBody.code === 'DBE' ? '서버에 문제가 있습니다.' :
      responseBody.code === 'AF' ? '인증에 실패했습니다.' :
      responseBody.code === 'NU' ? '존재하지 않는 유저입니다.' : '';

    const isSuccess = responseBody !== null && responseBody.code === 'SU';

    if(!isSuccess) {
      alert(message);
      return;
    }

    const {nickname, birth, gender, profileImage, mbti, job, selfIntro, likeKeywords} = responseBody as GetUserIntroductionResponseDto;
    setNickname(nickname);
    setBirth(birth);
    setGender(gender);
    setProfileImage(profileImage);
    setMbti(mbti);
    setJob(job);
    setSelfIntro(selfIntro);
    setLikeKeywords(likeKeywords);
  }

  // function: patch user introduction 처리 함수 //
  const patchUserIntroductionResponse = (responseBody: ResponseDto | null) => {
    const message = 
      !responseBody ? '서버에 문제가 있습니다.' :
      responseBody.code === 'DBE' ? '서버에 문제가 있습니다.' :
      responseBody.code === 'AF' ? '인증에 실패했습니다.' :
      responseBody.code === "NU" ? '존재하지 않는 유저입니다.' : '';
    
    const isSuccess = responseBody !== null && responseBody.code === 'SU';
    if(!isSuccess) {
      alert(message);
      return;
    }
  }

  // event handler: 프로필 사진 클릭 이벤트 처리 //
  const onProfileClickHandler = () => {
    if (!fileRef.current) return;
    fileRef.current.click();
  };

  // event handler: 내 활동 클릭 이벤트 처리 //
  const onClick = () => {
    navigator(MYPAGE_ACCOUNT_ABSOLUTE_PATH);
  }

  // event handler: 닉네임 변경 이벤트 처리 //
  const onNicknameChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setNickname(value);
  };

  // event handler: 나이 변경 이벤트 처리 //
  const onBirthChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setBirth(value);
  };

  // event handler: 성별 변경 이벤트 처리 //
  const onGenderChangeHandler = (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    setGender(value as Gender);
  };

  // event handler: MBTI 변경 이벤트 처리 //
  const onMbtiChangeHandler = (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    setMbti(value as Mbti);
  };

  // event handler: 직업 변경 이벤트 처리 //
  const onJobChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event?.target
    setJob(value);
  };

  // event handler: 자기소개 변경 이벤트 처리 //
  const onSelfIntroductionChangeHandler = (event: ChangeEvent<HTMLTextAreaElement>) => {

    const { value } = event.target;
    setSelfIntro(value);
  };

  // event handler: 프로필 이미지 변경 처리 //
  const onProfileImageChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (!files || !files.length) return;
  
    const file = files[0];
    setProfileImageFile(file);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setProfileImage(reader.result as string);
    };
  };

  // event handler: 프로필 이미지 삭제 처리 //
  const onProfileImageDeleteHandler = () => {
    setProfileImage(''); // 프로필 이미지 삭제
    setProfileImageFile(null); // 파일 상태 초기화
  };

  // event handler: 수정 버튼 클릭 이벤트 처리 //
  const onEditButtonClickHandler = async () => {
    if(isEditMode && !isActive) {
        alert('모든 정보를 입력해주세요!');
        return;
    }

    let finalProfileImage = profileImage;

    if (profileImageFile) {
      const formData = new FormData();
      formData.append('file', profileImageFile);
      const uploadedImageUrl = await fileUploadRequest(formData);
      
      if (!uploadedImageUrl) {
        alert("이미지 업로드에 실패했습니다.");
        return;
      }

      finalProfileImage = uploadedImageUrl;
    }

    const requestBody: PatchUserIntroductionRequestDto = {
      birth, gender: gender as Gender, job, mbti: mbti as Mbti, nickname, selfIntro, profileImage: finalProfileImage
    };

    patchUserIntroductionRequest(requestBody, accessToken).then(patchUserIntroductionResponse);

    setIsEditMode(!isEditMode);
  }

  // effect: 컴포넌트 로드시 실행할 함수 //
  useEffect(() => {
    if(!accessToken) return;
    
    getUserIntroductionRequest(accessToken).then(getUserIntroductionResponse);

  }, [])
 
  // render: 마이 페이지 메인 화면 컴포넌트 렌더링 //
  return (
    <div id='mypage-main-wrapper'>
      <MypageSidebar/>
      <div className='contents-wrapper'>
        <div className='title-area'>
          <div className='title'>마이페이지</div>
          <div className='current active'>내 정보</div>
          <div className='current' onClick={onClick}>내 활동</div>
        </div>
        <div className='correction-area'>
          <div className={updateButtonClass} onClick={onEditButtonClickHandler}>{buttonText}</div>
          <div className='bridge'>|</div>
          <div className='correction'>계정 설정</div>
        </div>
        <div className='body'>
          <div className='profile-area'>
            <div className='profile-container'>
              <div className='profile-image'>
              {isEditMode ? (
                <>
                  <img 
                    src={profileImage || DefaultProfile} 
                    alt="프로필 이미지" 
                    style={{ cursor: 'pointer' }} 
                    onClick={onProfileClickHandler}
                  />
                  <div className='profile-delete-button' onClick={onProfileImageDeleteHandler}></div>
                  <input ref={fileRef} style={{ display: 'none' }} type='file' accept='image/png, image/jpeg' onChange={onProfileImageChangeHandler} />
                </>
              ) : (
                <img src={profileImage || DefaultProfile} alt="프로필 이미지" />
              )}
              </div>
              <div className='name'>{nickname}</div>
            </div>
          </div>  
          <div className='user-info-area'>
            <div className='outline'>
              <div className='review-box'>
                <div className='text'>받은 후기 평점</div>
                <div className='rating'>5.0</div>
              </div>
              <div className='badge-box'>
                <div className='text'>뱃지</div>
                <div className='badge-image'>O</div>
              </div>
              <div className='achievements-box'>
                <div className='text'>업적</div>
                <div className='button-select'>✨자기소개 작성 완료</div>
                <div className='button change'>+</div>
              </div>
            </div>
            <div className='detail'>
              <div className='personal-info-box'> 
                <div className='title-box'>
                  <div className='text'>닉네임</div>
                  <div className='text'>나이</div>
                  <div className='text'>성별</div>
                  <div className='text'>MBTI</div>
                  <div className='text'>직업</div>
                </div>
                <div className='info-box'>
                {isEditMode ? (
                  <>
                    <input type="text" value={nickname} onChange={onNicknameChangeHandler} />
                    <input type="text" value={birth} onChange={onBirthChangeHandler} />

                    {/* 성별 드롭다운 */}
                    <select className='drop gender' value={gender || ''} onChange={onGenderChangeHandler}>
                      <option value="남">남</option>
                      <option value="여">여</option>
                    </select>

                    {/* MBTI 드롭다운 */}
                    <select className='drop mbti' value={mbti || ''} onChange={onMbtiChangeHandler}>
                      <option value="ISTJ">ISTJ</option>
                      <option value="ISFJ">ISFJ</option>
                      <option value="INFJ">INFJ</option>
                      <option value="INTJ">INTJ</option>
                      <option value="ISTP">ISTP</option>
                      <option value="ISFP">ISFP</option>
                      <option value="INFP">INFP</option>
                      <option value="INTP">INTP</option>
                      <option value="ESTP">ESTP</option>
                      <option value="ESFP">ESFP</option>
                      <option value="ENFP">ENFP</option>
                      <option value="ENTP">ENTP</option>
                      <option value="ESTJ">ESTJ</option>
                      <option value="ESFJ">ESFJ</option>
                      <option value="ENFJ">ENFJ</option>
                      <option value="ENTJ">ENTJ</option>
                    </select>

                    <input type="text" value={job} onChange={onJobChangeHandler} />
                  </>
                ) : (
                  <>
                    <div className='sub-text'>{nickname}</div>
                    <div className='sub-text'>{birth}</div>
                    <div className='sub-text'>{gender}</div>
                    <div className='sub-text'>{mbti}</div>
                    <div className='sub-text'>{job}</div>
                  </>
                )}
                </div>
              </div>
              <div className='specialty-box'>
                <div className='tag-button-wrapper'>
                  <div className='plus-tag-button' onClick={onModalOpenButtonClickHandler}></div>
                  {isModalOpen && 
                  <Modal 
                    title='키워드를 추가해보세요!' 
                    onClose={onModalOpenButtonClickHandler} 
                  >
                    <input 
                      className='keyword-input' 
                      type='text' 
                      value={addKeyword} 
                      onChange={addKeywordChangeHandler} 
                      placeholder="추가할 키워드를 입력하세요"
                    />
                    <div onClick={onAddKeywordClickHandler}>추가</div>
                  </Modal>}
                  <div className='text'>#잘해요</div>
                  <div className='minus-tag-button' onClick={deleteKeywordClickHandler}></div>
                </div>
                <div className='tag-container'>
                  {Array.isArray(likeKeywords) &&
                    Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="tag-box">
                      {likeKeywords.slice(i * 2, i * 2 + 2).map((item, j) => (
                        <div key={j} className="tag-wrapper">
                          <div className="tag">#{item.keyword}</div>
                          {deleteMode && (
                            <div 
                              className="minus-button" 
                              onClick={() => {
                                onDeleteKeywordClickHandler(item.keyword)
                              }}>
                              -
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='introduce-box'>
          <div className='introduce-title'>자기소개</div>
          <div className='introduce-datail'>{isEditMode ? (
            <div className='textarea-wrapper'>
              <textarea
              className='self-intro-textarea'
              value={selfIntro}
              onChange={onSelfIntroductionChangeHandler}
              maxLength={250}
              /> 
              <div className='char-count'>{selfIntro.length} / 250</div>
            </div>
            ): (<div className='sub-text'>{selfIntro}</div>)}
          </div>
        </div>
        
      </div>

    </div>
  )
}
